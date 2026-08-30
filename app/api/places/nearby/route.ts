import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

function centerFromGeojson(geo:any){
  const coords:Array<[number,number]>=(geo?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2);
  if(!coords.length)return null;
  const sum=coords.reduce((a,[lng,lat])=>({lng:a.lng+Number(lng),lat:a.lat+Number(lat)}),{lng:0,lat:0});
  return {lng:sum.lng/coords.length,lat:sum.lat/coords.length,source:"route" as const};
}
async function geocodeStart(key:string,course:any){
  const query=[course.region,course.city,course.start_name||course.name].filter(Boolean).join(" ");
  if(!query)return null;
  const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  endpoint.searchParams.set("query",query);endpoint.searchParams.set("size","1");
  const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
  if(!r.ok)return null;const j:any=await r.json().catch(()=>({}));const p=j?.documents?.[0];if(!p)return null;
  const lat=Number(p.y),lng=Number(p.x);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng,source:"start" as const,label:p.place_name||course.start_name||course.name}:null;
}
function cleanText(v:string){return String(v||"").replace(/<[^>]+>/g,"").replace(/&quot;/g,'"').replace(/&amp;/g,"&").trim();}
function areaHint(address?:string|null){const parts=String(address||"").split(/\s+/).filter(Boolean);return parts.slice(0,3).join(" ");}
function runnerScore(p:any){
  const curated=p.curated?28:0,verified=p.verified?8:0;
  const fav=Math.min(24,Number(p.favorite_count||0)*4),plans=Math.min(30,Number(p.plan_count||0)*6);
  const reviews=Math.min(18,Math.log10(Number(p.review_signal||0)+1)*5.5);
  const distance=Math.min(10,Number(p.distance_m||0)/500);
  return Math.max(0,Math.min(100,Math.round(curated+verified+fav+plans+reviews-distance)));
}

export async function GET(req:Request){
  const url=new URL(req.url);const courseId=url.searchParams.get("courseId");
  if(!courseId)return NextResponse.json({error:"courseId required"},{status:400});
  const sb=await createClient();
  const {data:course}=await sb.from("runart_courses").select("id,name,region,city,start_name,route_geojson").eq("id",courseId).maybeSingle();
  if(!course)return NextResponse.json({error:"course not found"},{status:404});
  const courseRegion=course.region||"",courseCity=course.city||"";
  const {data:curated}=await sb.from("runart_course_places")
    .select("distance_m,walking_minutes,editorial_note,recommended_after_run,runart_places(id,name,category,address,latitude,longitude,tags,price_level,source_name,source_url,verified)")
    .eq("course_id",courseId).order("sort_order");
  const {data:popularity}=await sb.rpc("runart_place_popularity");
  const popularityMap=new Map((popularity||[]).map((x:any)=>[String(x.place_id),{favorite_count:Number(x.favorite_count||0),plan_count:Number(x.plan_count||0)}]));
  const curatedPlaces=(curated||[]).map((x:any)=>{const p=x.runart_places;const pop=popularityMap.get(String(p.id))||{favorite_count:0,plan_count:0};return {...p,distance_m:x.distance_m,walking_minutes:x.walking_minutes,editorial_note:x.editorial_note,curated:true,review_signal:null,review_samples:[],...pop}});
  const key=process.env.KAKAO_REST_API_KEY;
  if(!key){const decorated=curatedPlaces.map((p:any)=>({...p,runner_score:runnerScore(p)}));return NextResponse.json({configured:false,center:null,curated:decorated,live:[],radius_m:5000});}
  const center=centerFromGeojson(course.route_geojson)||await geocodeStart(key,course);
  if(!center){const decorated=curatedPlaces.map((p:any)=>({...p,runner_score:runnerScore(p)}));return NextResponse.json({configured:true,center:null,curated:decorated,live:[],radius_m:5000});}
  const fixedCenter={lng:center.lng,lat:center.lat};
  const {data:savedPlaces}=await sb.from("runart_places").select("id,name,address,source_url,verified");
  const savedByUrl=new Map((savedPlaces||[]).filter((p:any)=>p.source_url).map((p:any)=>[String(p.source_url),p]));
  const savedByKey=new Map((savedPlaces||[]).map((p:any)=>[`${p.name}|${p.address||""}`,p]));
  async function searchCategory(code:string){
    const endpoint=new URL("https://dapi.kakao.com/v2/local/search/category.json");
    endpoint.searchParams.set("category_group_code",code);endpoint.searchParams.set("x",String(fixedCenter.lng));endpoint.searchParams.set("y",String(fixedCenter.lat));endpoint.searchParams.set("radius","5000");endpoint.searchParams.set("sort","distance");endpoint.searchParams.set("size","15");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
    let j:any={};try{j=await r.json();}catch{}
    if(!r.ok)return {places:[],error:{category:code,status:r.status,code:j?.code??null,message:j?.msg||"Kakao Local request failed"}};
    const places=(j.documents||[]).map((p:any)=>{const address=p.road_address_name||p.address_name;const saved=savedByUrl.get(String(p.place_url))||savedByKey.get(`${p.place_name}|${address||""}`);const pop=saved?popularityMap.get(String(saved.id)):{favorite_count:0,plan_count:0};return {id:`kakao:${p.id}`,saved_place_id:saved?.id||null,name:p.place_name,category:code==="FD6"?"restaurant":"cafe",address,latitude:Number(p.y),longitude:Number(p.x),source_name:"Kakao Local",source_url:p.place_url,distance_m:Number(p.distance||0),curated:false,verified:!!saved?.verified,review_signal:null,review_samples:[],favorite_count:Number(pop?.favorite_count||0),plan_count:Number(pop?.plan_count||0)}});
    return {places,error:null};
  }
  async function reviewSignal(place:any){
    const endpoint=new URL("https://dapi.kakao.com/v2/search/blog");
    const hint=areaHint(place.address)||[courseRegion,courseCity].filter(Boolean).join(" ");
    endpoint.searchParams.set("query",`${hint} ${place.name} 맛집 후기`);endpoint.searchParams.set("size","3");endpoint.searchParams.set("sort","recency");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
    if(!r.ok)return {...place,runner_score:runnerScore(place)};
    const j:any=await r.json().catch(()=>({}));
    const samples=(j.documents||[]).slice(0,3).map((d:any)=>({title:cleanText(d.title),url:d.url,blogname:cleanText(d.blogname),datetime:d.datetime}));
    const enriched={...place,review_signal:Number(j?.meta?.total_count||0),review_samples:samples};
    return {...enriched,runner_score:runnerScore(enriched)};
  }
  const [food,cafe]=await Promise.all([searchCategory("FD6"),searchCategory("CE7")]);
  const foodTop=food.places.slice(0,10);const cafeTop=cafe.places.slice(0,6);
  const [foodEnriched,cafeEnriched]=await Promise.all([Promise.all(foodTop.map(reviewSignal)),Promise.all(cafeTop.map(reviewSignal))]);
  const curatedDecorated=curatedPlaces.map((p:any)=>({...p,runner_score:runnerScore(p)}));
  const rank=(a:any,b:any)=>Number(b.runner_score||0)-Number(a.runner_score||0)||Number(b.review_signal||0)-Number(a.review_signal||0)||Number(a.distance_m||99999)-Number(b.distance_m||99999);
  const live=[...foodEnriched.sort(rank),...cafeEnriched.sort(rank)];
  const errors=[food.error,cafe.error].filter(Boolean);
  return NextResponse.json({configured:true,center:fixedCenter,center_source:center.source,center_label:(center as any).label||null,curated:curatedDecorated,live,radius_m:5000,ranking:"runner_score",review_signal_note:"블로그 후기 검색량은 실제 이용자 경험을 반영하기 위한 참고 신호이며 공식 평점이 아닙니다.",runner_score_note:"RUNART 러너 점수는 RUNART PICK, 찜 수, RUN + EAT 저장 수, 후기 신호, 거리를 합산한 추천 지표입니다.",kakao:errors.length?{ok:false,errors}:{ok:true}});
}
