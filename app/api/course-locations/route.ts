import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export const revalidate=86400;

type CourseRow={id:string;name:string;region:string;city:string|null;start_name:string|null;route_geojson:any};

function centerFromGeojson(geo:any){
  const coords:Array<[number,number]>=(geo?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2);
  if(!coords.length)return null;
  const sum=coords.reduce((a,[lng,lat])=>({lng:a.lng+Number(lng),lat:a.lat+Number(lat)}),{lng:0,lat:0});
  return {lng:sum.lng/coords.length,lat:sum.lat/coords.length};
}

export async function GET(){
  const sb=await createClient();
  const {data,error}=await sb.from("runart_courses")
    .select("id,name,region,city,start_name,route_geojson")
    .eq("status","approved");
  if(error)return NextResponse.json({error:error.message},{status:500});

  const courses=(data||[]) as CourseRow[];
  const key=process.env.KAKAO_REST_API_KEY;
  const locations:Record<string,any>={};
  const missing:CourseRow[]=[];

  for(const c of courses){
    const center=centerFromGeojson(c.route_geojson);
    if(center){locations[c.id]={...center,source:"route",label:c.start_name||c.name};}
    else missing.push(c);
  }

  if(!key){
    return NextResponse.json({configured:false,locations,unresolved:missing.map(c=>c.id)},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=604800"}});
  }

  const groups=new Map<string,CourseRow[]>();
  for(const c of missing){
    const place=c.start_name||c.name;
    const query=[c.region,c.city,place].filter(Boolean).join(" ");
    if(!groups.has(query))groups.set(query,[]);
    groups.get(query)!.push(c);
  }

  const entries=Array.from(groups.entries());
  const results=await Promise.all(entries.map(async([query,rows])=>{
    try{
      const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
      endpoint.searchParams.set("query",query);
      endpoint.searchParams.set("size","1");
      const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},next:{revalidate:86400}});
      if(!r.ok)return {rows,location:null};
      const j=await r.json();
      const p=j.documents?.[0];
      if(!p)return {rows,location:null};
      const lat=Number(p.y),lng=Number(p.x);
      if(!Number.isFinite(lat)||!Number.isFinite(lng))return {rows,location:null};
      return {rows,location:{lat,lng,source:"kakao",label:p.place_name||rows[0].start_name||rows[0].name,address:p.road_address_name||p.address_name||null}};
    }catch{return {rows,location:null};}
  }));

  const unresolved:string[]=[];
  for(const item of results){
    if(item.location){for(const c of item.rows)locations[c.id]=item.location;}
    else unresolved.push(...item.rows.map(c=>c.id));
  }

  return NextResponse.json({configured:true,locations,unresolved,updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=604800"}});
}
