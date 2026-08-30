import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

function centerFromGeojson(geo:any){
  const coords:Array<[number,number]>=(geo?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2);
  if(!coords.length)return null;
  const sum=coords.reduce((a,[lng,lat])=>({lng:a.lng+Number(lng),lat:a.lat+Number(lat)}),{lng:0,lat:0});
  return {lng:sum.lng/coords.length,lat:sum.lat/coords.length};
}
function cleanText(v:string){return String(v||"").replace(/<[^>]+>/g,"").replace(/&quot;/g,'"').replace(/&amp;/g,"&").trim();}
function areaHint(address?:string|null){const parts=String(address||"").split(/\s+/).filter(Boolean);return parts.slice(0,3).join(" ");}

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
  const curatedPlaces=(curated||[]).map((x:any)=>({...x.runart_places,distance_m:x.distance_m,walking_minutes:x.walking_minutes,editorial_note:x.editorial_note,curated:true,review_signal:null,review_samples:[]}));
  const key=process.env.KAKAO_REST_API_KEY;const center=centerFromGeojson(course.route_geojson);
  if(!key||!center)return NextResponse.json({configured:!!key,center,curated:curatedPlaces,live:[],radius_m:5000});
  const fixedCenter={lng:center.lng,lat:center.lat};
  async function searchCategory(code:string){
    const endpoint=new URL("https://dapi.kakao.com/v2/local/search/category.json");
    endpoint.searchParams.set("category_group_code",code);endpoint.searchParams.set("x",String(fixedCenter.lng));endpoint.searchParams.set("y",String(fixedCenter.lat));endpoint.searchParams.set("radius","5000");endpoint.searchParams.set("sort","distance");endpoint.searchParams.set("size","15");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
    let j:any={};try{j=await r.json();}catch{}
    if(!r.ok)return {places:[],error:{category:code,status:r.status,code:j?.code??null,message:j?.msg||"Kakao Local request failed"}};
    const places=(j.documents||[]).map((p:any)=>({id:`kakao:${p.id}`,name:p.place_name,category:code==="FD6"?"restaurant":"cafe",address:p.road_address_name||p.address_name,latitude:Number(p.y),longitude:Number(p.x),source_name:"Kakao Local",source_url:p.place_url,distance_m:Number(p.distance||0),curated:false,review_signal:null,review_samples:[]}));
    return {places,error:null};
  }
  async function reviewSignal(place:any){
    const endpoint=new URL("https://dapi.kakao.com/v2/search/blog");
    const hint=areaHint(place.address)||[courseRegion,courseCity].filter(Boolean).join(" ");
    endpoint.searchParams.set("query",`${hint} ${place.name} 맛집 후기`);endpoint.searchParams.set("size","3");endpoint.searchParams.set("sort","recency");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
    if(!r.ok)return place;
    const j:any=await r.json().catch(()=>({}));
    const samples=(j.documents||[]).slice(0,3).map((d:any)=>({title:cleanText(d.title),url:d.url,blogname:cleanText(d.blogname),datetime:d.datetime}));
    return {...place,review_signal:Number(j?.meta?.total_count||0),review_samples:samples};
  }
  const [food,cafe]=await Promise.all([searchCategory("FD6"),searchCategory("CE7")]);
  const foodTop=food.places.slice(0,10);const cafeTop=cafe.places.slice(0,6);
  const [foodEnriched,cafeEnriched]=await Promise.all([Promise.all(foodTop.map(reviewSignal)),Promise.all(cafeTop.map(reviewSignal))]);
  const rank=(a:any,b:any)=>{const ar=Number(a.review_signal||0),br=Number(b.review_signal||0);if(ar!==br)return br-ar;return Number(a.distance_m||99999)-Number(b.distance_m||99999)};
  const live=[...foodEnriched.sort(rank),...cafeEnriched.sort(rank)];
  const errors=[food.error,cafe.error].filter(Boolean);
  return NextResponse.json({configured:true,center:fixedCenter,curated:curatedPlaces,live,radius_m:5000,ranking:"review_signal_then_distance",review_signal_note:"블로그 후기 검색량은 실제 이용자 경험을 반영하기 위한 참고 신호이며 공식 평점이 아닙니다.",kakao:errors.length?{ok:false,errors}:{ok:true}});
}
