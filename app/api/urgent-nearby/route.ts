import {NextRequest,NextResponse} from "next/server";

type Point={lat:number;lng:number};
type FacilityType="toilet"|"parking"|"water"|"convenience";

function distanceM(a:Point,b:Point){
  const R=6371000,toRad=(v:number)=>v*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return Math.round(2*R*Math.asin(Math.sqrt(s)));
}

async function fetchOverpass(query:string){
  const endpoints=[
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
  ];
  for(const endpoint of endpoints){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),7000);
      const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"TTWITTUN-RUNART/1.0"},body:new URLSearchParams({data:query}),cache:"no-store",signal:controller.signal});
      clearTimeout(timer);
      if(!r.ok)continue;
      const json=await r.json();
      if(Array.isArray(json?.elements))return {json,provider:endpoint};
    }catch{}
  }
  throw new Error("facility provider unavailable");
}

async function nearestToilets(origin:Point){
  const q=`[out:json][timeout:7];(node["amenity"="toilets"](around:1800,${origin.lat},${origin.lng});way["amenity"="toilets"](around:1800,${origin.lat},${origin.lng});relation["amenity"="toilets"](around:1800,${origin.lat},${origin.lng}););out center tags;`;
  const {json,provider}=await fetchOverpass(q);
  const rows=(json.elements||[]).map((e:any)=>{
    const lat=Number(e.lat??e.center?.lat),lng=Number(e.lon??e.center?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
    return {
      id:`osm:${e.type}:${e.id}`,
      type:"toilet",
      name:e.tags?.name||e.tags?.["name:ko"]||"공중화장실",
      lat,lng,
      distance_m:distanceM(origin,{lat,lng}),
      opening_hours:e.tags?.opening_hours||null,
      fee:e.tags?.fee||null,
      wheelchair:e.tags?.wheelchair||null,
      source:"OpenStreetMap"
    };
  }).filter(Boolean).sort((a:any,b:any)=>a.distance_m-b.distance_m).slice(0,5);
  return {rows,provider};
}

async function nearestWater(origin:Point){
  const q=`[out:json][timeout:7];(node["amenity"="drinking_water"](around:2200,${origin.lat},${origin.lng});way["amenity"="drinking_water"](around:2200,${origin.lat},${origin.lng});node["drinking_water"="yes"](around:2200,${origin.lat},${origin.lng});node["amenity"="fountain"]["drinking_water"="yes"](around:2200,${origin.lat},${origin.lng}););out center tags;`;
  const {json,provider}=await fetchOverpass(q);
  const seen=new Set<string>();
  const rows=(json.elements||[]).map((e:any)=>{
    const lat=Number(e.lat??e.center?.lat),lng=Number(e.lon??e.center?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
    const id=`osm:${e.type}:${e.id}`;
    if(seen.has(id))return null;seen.add(id);
    return {
      id,
      type:"water",
      name:e.tags?.name||e.tags?.["name:ko"]||"음수대/식수대",
      lat,lng,
      distance_m:distanceM(origin,{lat,lng}),
      opening_hours:e.tags?.opening_hours||null,
      source:"OpenStreetMap"
    };
  }).filter(Boolean).sort((a:any,b:any)=>a.distance_m-b.distance_m).slice(0,5);
  return {rows,provider};
}

async function kakaoKeyword(origin:Point,query:string,type:"parking"|"convenience",radius:number){
  const key=process.env.KAKAO_REST_API_KEY;
  if(!key)return {rows:[],provider:"Kakao Local",warning:"Kakao Local API key is not configured"};
  const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  endpoint.searchParams.set("query",query);
  endpoint.searchParams.set("x",String(origin.lng));
  endpoint.searchParams.set("y",String(origin.lat));
  endpoint.searchParams.set("radius",String(radius));
  endpoint.searchParams.set("sort","distance");
  endpoint.searchParams.set("size","15");
  const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
  const j:any=await r.json().catch(()=>({}));
  if(!r.ok)return {rows:[],provider:"Kakao Local",warning:j?.msg||"Kakao Local request failed"};
  const rows=(j.documents||[]).map((p:any)=>({
    id:`kakao:${p.id}`,
    type,
    name:p.place_name||(type==="parking"?"주차장":"편의점"),
    lat:Number(p.y),lng:Number(p.x),
    distance_m:Number(p.distance||0),
    address:p.road_address_name||p.address_name||null,
    source_url:p.place_url||null,
    source:"Kakao Local"
  })).filter((x:any)=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)).slice(0,5);
  return {rows,provider:"Kakao Local"};
}

async function nearestParking(origin:Point){return kakaoKeyword(origin,"주차장","parking",3000);}
async function nearestConvenience(origin:Point){return kakaoKeyword(origin,"편의점","convenience",2500);}

export async function GET(req:NextRequest){
  const lat=Number(req.nextUrl.searchParams.get("lat")),lng=Number(req.nextUrl.searchParams.get("lng"));
  const raw=req.nextUrl.searchParams.get("type");
  const type:FacilityType=raw==="parking"||raw==="water"||raw==="convenience"?raw:"toilet";
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180){
    return NextResponse.json({error:"valid lat/lng required"},{status:400});
  }
  const origin={lat,lng};
  try{
    const result=type==="parking"?await nearestParking(origin):type==="water"?await nearestWater(origin):type==="convenience"?await nearestConvenience(origin):await nearestToilets(origin);
    return NextResponse.json({type,origin,facilities:result.rows,nearest:result.rows[0]||null,provider:result.provider,warning:(result as any).warning||null,updatedAt:new Date().toISOString()});
  }catch{
    const label=type==="toilet"?"화장실":type==="parking"?"주차장":type==="water"?"식수대":"편의점";
    return NextResponse.json({type,origin,facilities:[],nearest:null,warning:`근처 ${label} 정보를 불러오지 못했습니다.`},{status:200});
  }
}
