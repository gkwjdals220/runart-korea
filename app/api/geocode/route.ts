import {NextRequest,NextResponse} from "next/server";

export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get("q")||"").trim();
  if(!q)return NextResponse.json({error:"q is required"},{status:400});
  const key=process.env.KAKAO_REST_API_KEY;
  if(!key)return NextResponse.json({error:"Kakao Local is not configured"},{status:503});
  try{
    const endpoint=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    endpoint.searchParams.set("query",q);endpoint.searchParams.set("size","5");
    const r=await fetch(endpoint,{headers:{Authorization:`KakaoAK ${key}`},cache:"no-store"});
    const j=await r.json();
    if(!r.ok)return NextResponse.json({error:j?.msg||"Kakao Local failed",code:j?.code||null},{status:r.status});
    const results=(j.documents||[]).map((p:any)=>({name:p.place_name,address:p.road_address_name||p.address_name||null,lat:Number(p.y),lng:Number(p.x),category:p.category_name||null})).filter((x:any)=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
    return NextResponse.json({query:q,results});
  }catch(e:any){return NextResponse.json({error:e?.message||"geocode failed"},{status:500});}
}
