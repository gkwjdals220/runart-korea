import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

type Coord=[number,number];

function bbox(coords:Coord[]){
  const lngs=coords.map(c=>Number(c[0])).filter(Number.isFinite);
  const lats=coords.map(c=>Number(c[1])).filter(Number.isFinite);
  if(!lngs.length||!lats.length)return null;
  const pad=.006; // roughly 500-700m in Korea
  return {south:Math.min(...lats)-pad,west:Math.min(...lngs)-pad,north:Math.max(...lats)+pad,east:Math.max(...lngs)+pad};
}

export async function GET(req:NextRequest){
  const courseId=req.nextUrl.searchParams.get("courseId");
  if(!courseId)return NextResponse.json({error:"courseId is required"},{status:400});
  const sb=await createClient();
  const {data:course,error}=await sb.from("runart_courses").select("id,route_geojson").eq("id",courseId).eq("status","approved").maybeSingle();
  if(error)return NextResponse.json({error:error.message},{status:500});
  if(!course)return NextResponse.json({error:"course not found"},{status:404});
  const coords=(course.route_geojson?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2) as Coord[];
  const b=bbox(coords);
  if(!b)return NextResponse.json({toilets:[],source:"OpenStreetMap"});
  const q=`[out:json][timeout:12];(node["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east});way["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east});relation["amenity"="toilets"](${b.south},${b.west},${b.north},${b.east}););out center tags;`;
  try{
    const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"RUNART-KOREA/1.0"},body:new URLSearchParams({data:q}),next:{revalidate:3600}});
    if(!r.ok)throw new Error(`Overpass ${r.status}`);
    const json=await r.json();
    const toilets=(json.elements||[]).map((e:any)=>({
      id:`osm:${e.type}:${e.id}`,
      name:e.tags?.name||e.tags?.["name:ko"]||"공중화장실",
      lat:Number(e.lat??e.center?.lat),lng:Number(e.lon??e.center?.lon),
      access:e.tags?.access||null,
      wheelchair:e.tags?.wheelchair||null,
      opening_hours:e.tags?.opening_hours||null,
      fee:e.tags?.fee||null,
      source:"OpenStreetMap"
    })).filter((x:any)=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
    return NextResponse.json({toilets,source:"OpenStreetMap",updatedAt:new Date().toISOString()});
  }catch(e:any){
    return NextResponse.json({toilets:[],source:"OpenStreetMap",warning:"화장실 데이터를 불러오지 못했습니다."},{status:200});
  }
}
