import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

function centerFromGeojson(geo:any){
  const coords:Array<[number,number]>=(geo?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2);
  if(!coords.length)return null;
  const sum=coords.reduce((a,[lng,lat])=>({lng:a.lng+Number(lng),lat:a.lat+Number(lat)}),{lng:0,lat:0});
  return {lng:sum.lng/coords.length,lat:sum.lat/coords.length};
}

export async function GET(req:Request){
  const url=new URL(req.url);const courseId=url.searchParams.get("courseId");
  if(!courseId)return NextResponse.json({error:"courseId required"},{status:400});
  const sb=await createClient();
  const {data:course}=await sb.from("runart_courses").select("id,name,route_geojson").eq("id",courseId).maybeSingle();
  if(!course)return NextResponse.json({error:"course not found"},{status:404});
  const {data:curated}=await sb.from("runart_course_places")
    .select("distance_m,walking_minutes,editorial_note,recommended_after_run,runart_places(id,name,category,address,latitude,longitude,tags,price_level,source_name,source_url,verified)")
    .eq("course_id",courseId).order("sort_order");
  const curatedPlaces=(curated||[]).map((x:any)=>({...x.runart_places,distance_m:x.distance_m,walking_minutes:x.walking_minutes,editorial_note:x.editorial_note,curated:true}));
  const key=process.env.KAKAO_REST_API_KEY;const center=centerFromGeojson(course.route_geojson);
  if(!key||!center)return NextResponse.json({configured:!!key,center,curated:curatedPlaces,live:[]});
  async function searchCategory(code:string){
    const endpoint=new URL("https://dapi.kakao.com/v2/local/search/category.json");
    endpoint.searchParams.set("category_group_code",code);endpoint.searchParams.set("x",String(center.lng));endpoint.searchParams.set("y",String(center.lat));endpoint.searchParams.set("radius","2000");endpoint.searchParams.set("sort","distance");endpoint.searchParams.set("size","8");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},next:{revalidate:3600}});if(!r.ok)return [];
    const j=await r.json();return (j.documents||[]).map((p:any)=>({id:`kakao:${p.id}`,name:p.place_name,category:code==="FD6"?"restaurant":"cafe",address:p.road_address_name||p.address_name,latitude:Number(p.y),longitude:Number(p.x),source_name:"Kakao Local",source_url:p.place_url,distance_m:Number(p.distance||0),curated:false}));
  }
  const [food,cafe]=await Promise.all([searchCategory("FD6"),searchCategory("CE7")]);
  return NextResponse.json({configured:true,center,curated:curatedPlaces,live:[...food,...cafe]});
}
