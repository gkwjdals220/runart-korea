import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

type Point={lat:number;lng:number};

function startFromGeojson(geo:any):Point|null{
  const first=geo?.coordinates?.[0];
  if(!Array.isArray(first)||first.length<2)return null;
  const lng=Number(first[0]),lat=Number(first[1]);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
  return {lat,lng};
}

async function geocodeStart(key:string,course:any):Promise<Point|null>{
  const query=[course.region,course.city,course.start_name||course.name].filter(Boolean).join(" ");
  if(!query)return null;
  const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  endpoint.searchParams.set("query",query);
  endpoint.searchParams.set("size","1");
  const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
  if(!r.ok)return null;
  const j:any=await r.json().catch(()=>({}));
  const p=j?.documents?.[0];
  if(!p)return null;
  const lat=Number(p.y),lng=Number(p.x);
  return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
}

export async function GET(req:Request){
  const url=new URL(req.url);
  const courseId=url.searchParams.get("courseId");
  if(!courseId)return NextResponse.json({error:"courseId required"},{status:400});

  const sb=await createClient();
  const {data:course}=await sb.from("runart_courses")
    .select("id,name,region,city,start_name,route_geojson")
    .eq("id",courseId).eq("status","approved").maybeSingle();
  if(!course)return NextResponse.json({error:"course not found"},{status:404});

  const key=process.env.KAKAO_REST_API_KEY;
  if(!key)return NextResponse.json({configured:false,start:null,parking:[]});

  const routeStart=startFromGeojson(course.route_geojson);
  const start=routeStart||await geocodeStart(key,course);
  if(!start)return NextResponse.json({configured:true,start:null,parking:[]});

  const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  endpoint.searchParams.set("query","공영주차장");
  endpoint.searchParams.set("x",String(start.lng));
  endpoint.searchParams.set("y",String(start.lat));
  endpoint.searchParams.set("radius","2500");
  endpoint.searchParams.set("sort","distance");
  endpoint.searchParams.set("size","10");

  const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
  let j:any={};try{j=await r.json();}catch{}
  if(!r.ok)return NextResponse.json({configured:true,start,parking:[],kakao:{ok:false,status:r.status,message:j?.msg||"Kakao Local request failed"}});

  const docs=(j.documents||[])
    .filter((p:any)=>/공영|공공|환승|구청|시청|공원.*주차장|주차장/.test(String(p.place_name||"")))
    .map((p:any)=>({
      id:`kakao:${p.id}`,
      name:p.place_name,
      address:p.road_address_name||p.address_name,
      latitude:Number(p.y),
      longitude:Number(p.x),
      distance_m:Number(p.distance||0),
      source_url:p.place_url,
      category:p.category_name||"주차장",
      public_likely:/공영|공공|환승|구청|시청/.test(String(p.place_name||""))
    }));

  const parking=[...docs].sort((a,b)=>{
    if(a.public_likely!==b.public_likely)return a.public_likely?-1:1;
    return a.distance_m-b.distance_m;
  }).slice(0,5);

  return NextResponse.json({configured:true,start,parking,kakao:{ok:true}});
}
