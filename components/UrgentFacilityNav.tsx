"use client";

import {useState} from "react";
import {usePathname} from "next/navigation";

type Facility={id:string;type:"toilet"|"parking";name:string;lat:number;lng:number;distance_m:number;address?:string|null;opening_hours?:string|null;fee?:string|null;wheelchair?:string|null};
type UserPos={lat:number;lng:number};

function kakaoDirections(f:Facility){
  return `https://map.kakao.com/link/to/${encodeURIComponent(f.name)},${f.lat},${f.lng}`;
}

function naverDirections(origin:UserPos,f:Facility){
  const sname=encodeURIComponent("현재 위치"),dname=encodeURIComponent(f.name);
  return `https://map.naver.com/p/directions/${origin.lng},${origin.lat},${sname}/${f.lng},${f.lat},${dname}/-/walk`;
}

export default function UrgentFacilityNav(){
  const pathname=usePathname();
  const inLiveRun=pathname.startsWith("/run/");
  const[open,setOpen]=useState(false),[loading,setLoading]=useState<"toilet"|"parking"|null>(null),[origin,setOrigin]=useState<UserPos|null>(null),[facility,setFacility]=useState<Facility|null>(null),[error,setError]=useState("");

  function find(type:"toilet"|"parking"){
    if(!navigator.geolocation){setError("현재 위치 기능을 사용할 수 없습니다.");setOpen(true);return;}
    setLoading(type);setError("");setFacility(null);setOpen(true);
    navigator.geolocation.getCurrentPosition(async pos=>{
      const here={lat:pos.coords.latitude,lng:pos.coords.longitude};setOrigin(here);
      try{
        const r=await fetch(`/api/urgent-nearby?lat=${here.lat}&lng=${here.lng}&type=${type}`,{cache:"no-store"});
        const data=await r.json();
        if(!r.ok)throw new Error(data?.error||"조회 실패");
        if(!data.nearest){setError(type==="toilet"?"1.8km 안에서 확인 가능한 화장실을 찾지 못했어요.":"3km 안에서 확인 가능한 주차장을 찾지 못했어요.");return;}
        setFacility(data.nearest);
      }catch{setError("주변 시설 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");}
      finally{setLoading(null);}
    },()=>{setLoading(null);setError("위치 권한을 허용해야 현재 위치 기준으로 찾을 수 있어요.");},{enableHighAccuracy:true,timeout:9000,maximumAge:30000});
  }

  const dockBottom=inLiveRun?168:82;
  const panelBottom=inLiveRun?220:136;
  return <>
    <div style={{position:"fixed",right:14,bottom:dockBottom,zIndex:1350,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"calc(100vw - 28px)"}} aria-label="긴급 주변 시설">
      <button type="button" onClick={()=>find("toilet")} style={{border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"10px 13px",fontWeight:800,background:"rgba(28,36,48,.94)",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.24)",backdropFilter:"blur(10px)"}}>{loading==="toilet"?"🚻 찾는 중…":inLiveRun?"🚻 화장실 SOS":"🚻 급한 화장실"}</button>
      {!inLiveRun&&<button type="button" onClick={()=>find("parking")} style={{border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"10px 13px",fontWeight:800,background:"rgba(28,36,48,.94)",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.24)",backdropFilter:"blur(10px)"}}>{loading==="parking"?"🚗 찾는 중…":"🚗 가까운 주차"}</button>}
    </div>
    {open&&<div role="dialog" aria-modal="false" aria-label="주변 시설 길찾기" style={{position:"fixed",right:14,bottom:panelBottom,zIndex:1360,width:"min(360px,calc(100vw - 28px))",border:"1px solid rgba(255,255,255,.14)",borderRadius:18,padding:14,background:"rgba(18,24,32,.97)",color:"white",boxShadow:"0 18px 50px rgba(0,0,0,.35)",backdropFilter:"blur(14px)"}}>
      <button type="button" aria-label="닫기" onClick={()=>setOpen(false)} style={{position:"absolute",right:10,top:8,border:0,background:"transparent",color:"white",fontSize:24,cursor:"pointer"}}>×</button>
      <small style={{opacity:.72}}>현재 위치 기준 · {inLiveRun?"러닝 중 긴급 길찾기":"가장 가까운 시설"}</small>
      {loading&&<p style={{margin:"8px 0 2px",fontWeight:800}}>가장 가까운 시설을 찾고 있어요…</p>}
      {error&&<p style={{margin:"8px 24px 2px 0",lineHeight:1.45}}>{error}</p>}
      {facility&&<div>
        <h3 style={{margin:"7px 24px 5px 0",fontSize:17}}>{facility.type==="toilet"?"🚻":"🚗"} {facility.name}</h3>
        <p style={{margin:"0 0 10px",opacity:.8,fontSize:13}}>직선거리 약 {facility.distance_m<1000?`${facility.distance_m}m`:`${(facility.distance_m/1000).toFixed(1)}km`}{facility.address?` · ${facility.address}`:""}</p>
        {facility.opening_hours&&<p style={{margin:"0 0 10px",fontSize:12,opacity:.72}}>운영시간 {facility.opening_hours}</p>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <a href={kakaoDirections(facility)} target="_blank" rel="noreferrer" style={{textAlign:"center",padding:"11px 8px",borderRadius:12,textDecoration:"none",fontWeight:900,background:"#fee500",color:"#111"}}>카카오 길찾기</a>
          {origin&&<a href={naverDirections(origin,facility)} target="_blank" rel="noreferrer" style={{textAlign:"center",padding:"11px 8px",borderRadius:12,textDecoration:"none",fontWeight:900,background:"#03c75a",color:"white"}}>네이버 도보</a>}
        </div>
        <p style={{margin:"9px 0 0",fontSize:11,opacity:.6,lineHeight:1.4}}>표시 거리는 직선거리입니다. 실제 이동거리·운영 여부는 지도 앱에서 최종 확인해주세요.</p>
      </div>}
    </div>}
  </>;
}
