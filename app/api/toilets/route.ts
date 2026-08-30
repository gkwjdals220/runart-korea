import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

type Coord=[number,number];

function bbox(coords:Coord[]){
  const lngs=coords.map(c=>Number(c[0])).filter(Number.isFinite);
  const lats=coords.map(c=>Number(c[1])).filter(Number.isFinite);
  if(!lngs.length||!lats.length)return null;
  const pad=.006;
  return {south:Math.min(...lats)-pad,west:Math.min(...lngs)-pad,north:Math.max(...lats)+pad,east:Math.max(...lngs)+pad};
}

async function geocodeStart(course:any){
  const key=process.env.KAKAO_REST_API_KEY;
  if(!key)return null;
  const query=[course.region,course.city,course.start_name||course.name].filter(Boolean).join(" ");
  try{
    const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    endpoint.searchParams.set("query",query);endpoint.searchParams.set("size","1");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},next:{revalidate:86400}});
    if(!r.ok)return null;
    const j=await r.json();const p=j.documents?.[0];if(!p)return null;
    const lat=Number(p.y),lng=Number(p.x);if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
    return {lat,lng};
  }catch{return null;}
}

export async function GET(req:NextRequest){
  const courseId=req.nextUrl.searchParams.get("courseId");
  if(!courseId)return NextResponse.json({error:"courseId is required"},{status:400});
  const sb=await createClient();
  const {data:course,error}=await sb.from("runart_courses").select("id,name,region,city,start_name,route_geojson").eq("id",courseId).eq("status","approved").maybeSingle();
  if(error)return NextResponse.json({error:error.message},{status:500});
  if(!course)return NextResponse.json({error:"course not found"},{status:404});
  let coords=(course.route_geojson?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2) as Coord[];
  let locationSource="route";
  if(!coords.length){
    const start=await geocodeStart(course);
    if(start){coords=[[start.lng,start.lat]];locationSource="start";}
  }
  const b=bbox(coords);
  if(!b)return NextResponse.json({toilets:[],source:"OpenStreetMap",warning:"코스 또는 출발점 좌표를 확인하지 못했습니다."});
  const q=`[out:json][timeout:12];(node["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east});way["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east});relation["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east}););out center tags;`;
  try{
    const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"RUNART-KOREA/1.0"},body:new URLSearchParams({data:q}),next:{revalidate:3600}});
    if(!r.ok)throw new Error(`Overpass ${r.status}`);
    const json=await r.json();
    const toilets=(json.elements||[]).map((e:any)=>({
      id:`osm:${e.type}:${e.id}`,
      name:e.tags?.name||e.tags?.["name:ko"]||"공중화장실",
      lat:Number(e.lat??e.center?.lat),lng:Number(e.lon??e.center?.lon),
      access:e.tags?.access||null,wheelchair:e.tags?.wheelchair||null,
      opening_hours:e.tags?.opening_hours||null,fee:e.tags?.fee||null,source:"OpenStreetMap"
    })).filter((x:any)=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
    return NextResponse.json({toilets,source:"OpenStreetMap",locationSource,updatedAt:new Date().toISOString()});
  }catch{
    return NextResponse.json({toilets:[],source:"OpenStreetMap",locationSource,warning:"화장실 데이터를 불러오지 못했습니다."},{status:200});
  }
}
