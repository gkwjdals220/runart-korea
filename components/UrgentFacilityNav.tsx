"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

type FacilityType="toilet"|"parking"|"water"|"convenience";
type Facility={id:string;type:FacilityType;name:string;lat:number;lng:number;distance_m:number;address?:string|null;opening_hours?:string|null;fee?:string|null;wheelchair?:string|null};
type UserPos={lat:number;lng:number};

const META:Record<FacilityType,{icon:string;label:string;empty:string}>={
  toilet:{icon:"🚻",label:"화장실",empty:"1.8km 안에서 확인 가능한 화장실을 찾지 못했어요."},
  parking:{icon:"🚗",label:"주차",empty:"3km 안에서 확인 가능한 주차장을 찾지 못했어요."},
  water:{icon:"💧",label:"식수",empty:"2.2km 안에서 확인 가능한 식수대/음수대를 찾지 못했어요."},
  convenience:{icon:"🏪",label:"편의점",empty:"2.5km 안에서 확인 가능한 편의점을 찾지 못했어요."}
};

function kakaoDirections(f:Facility){return `https://map.kakao.com/link/to/${encodeURIComponent(f.name)},${f.lat},${f.lng}`;}
function naverDirections(origin:UserPos,f:Facility){const s=encodeURIComponent("현재 위치"),d=encodeURIComponent(f.name);return `https://map.naver.com/p/directions/${origin.lng},${origin.lat},${s}/${f.lng},${f.lat},${d}/-/walk`;}
function distanceText(m:number){return m<1000?`${m}m`:`${(m/1000).toFixed(1)}km`;}

export default function UrgentFacilityNav(){
  const pathname=usePathname(),inLiveRun=pathname.startsWith("/run/");
  const[open,setOpen]=useState(false),[loading,setLoading]=useState<FacilityType|null>(null),[origin,setOrigin]=useState<UserPos|null>(null),[facilities,setFacilities]=useState<Facility[]>([]),[error,setError]=useState("");

  useEffect(()=>{setOpen(false);setLoading(null);setOrigin(null);setFacilities([]);setError("");},[pathname]);

  function find(type:FacilityType){
    if(!navigator.geolocation){setError("현재 위치 기능을 사용할 수 없습니다.");setOpen(true);return;}
    setLoading(type);setError("");setFacilities([]);setOpen(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      const here={lat:pos.coords.latitude,lng:pos.coords.longitude};setOrigin(here);
      try{
        const r=await fetch(`/api/urgent-nearby?lat=${here.lat}&lng=${here.lng}&type=${type}`,{cache:"no-store"});
        const data=await r.json();
        if(!r.ok)throw new Error(data?.error||"조회 실패");
        const rows:Array<Facility>=Array.isArray(data.facilities)?data.facilities:[];
        if(!rows.length){setError(META[type].empty);return;}
        setFacilities(rows.slice(0,type==="water"||type==="convenience"?3:2));
      }catch{setError("주변 시설 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");}
      finally{setLoading(null);}
    },()=>{setLoading(null);setError("위치 권한을 허용해야 현재 위치 기준으로 찾을 수 있어요.");},{enableHighAccuracy:true,timeout:9000,maximumAge:30000});
  }

  if(!inLiveRun)return null;

  const dockBottom=168,panelBottom=220;
  const buttonStyle={border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"10px 13px",fontWeight:800,background:"rgba(28,36,48,.94)",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.24)",backdropFilter:"blur(10px)"} as const;
  return <>
    <div style={{position:"fixed",right:14,bottom:dockBottom,zIndex:1350,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"calc(100vw - 28px)"}} aria-label="러닝 중 주변 시설">
      <button type="button" onClick={()=>find("toilet")} style={buttonStyle}>{loading==="toilet"?"🚻 찾는 중…":"🚻 화장실 SOS"}</button>
      <button type="button" onClick={()=>find("water")} style={buttonStyle}>{loading==="water"?"💧 찾는 중…":"💧 물 SOS"}</button>
      <button type="button" onClick={()=>find("convenience")} style={buttonStyle}>{loading==="convenience"?"🏪 찾는 중…":"🏪 편의점"}</button>
      <button type="button" onClick={()=>find("parking")} style={buttonStyle}>{loading==="parking"?"🚗 찾는 중…":"🚗 주차"}</button>
    </div>
    {open&&<div role="dialog" aria-modal="false" aria-label="주변 시설 길찾기" style={{position:"fixed",right:14,bottom:panelBottom,zIndex:1360,width:"min(380px,calc(100vw - 28px))",maxHeight:"min(66vh,520px)",overflowY:"auto",border:"1px solid rgba(255,255,255,.14)",borderRadius:18,padding:14,background:"rgba(18,24,32,.97)",color:"white",boxShadow:"0 18px 50px rgba(0,0,0,.35)",backdropFilter:"blur(14px)"}}>
      <button type="button" aria-label="닫기" onClick={()=>setOpen(false)} style={{position:"absolute",right:10,top:8,border:0,background:"transparent",color:"white",fontSize:24,cursor:"pointer"}}>×</button>
      <small style={{opacity:.72}}>현재 위치 기준 · 러닝 중 빠른 길찾기</small>
      {loading&&<p style={{margin:"8px 0 2px",fontWeight:800}}>{META[loading].icon} 가까운 {META[loading].label} 정보를 찾고 있어요…</p>}
      {error&&<p style={{margin:"8px 24px 2px 0",lineHeight:1.45}}>{error}</p>}
      {facilities.map((f,i)=><div key={f.id} style={{marginTop:10,paddingTop:i?12:2,borderTop:i?"1px solid rgba(255,255,255,.1)":"none"}}>
        <h3 style={{margin:"4px 24px 4px 0",fontSize:16}}>{i+1}. {META[f.type].icon} {f.name}</h3>
        <p style={{margin:"0 0 8px",opacity:.8,fontSize:13}}>직선거리 약 {distanceText(f.distance_m)}{f.address?` · ${f.address}`:""}</p>
        {f.opening_hours&&<p style={{margin:"0 0 8px",fontSize:12,opacity:.72}}>운영시간 {f.opening_hours}</p>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          <a href={kakaoDirections(f)} target="_blank" rel="noreferrer" style={{textAlign:"center",padding:"9px 7px",borderRadius:10,textDecoration:"none",fontWeight:900,background:"#fee500",color:"#111"}}>카카오 길찾기</a>
          {origin&&<a href={naverDirections(origin,f)} target="_blank" rel="noreferrer" style={{textAlign:"center",padding:"9px 7px",borderRadius:10,textDecoration:"none",fontWeight:900,background:"#03c75a",color:"white"}}>네이버 도보</a>}
        </div>
      </div>)}
    </div>}
  </>;
}
