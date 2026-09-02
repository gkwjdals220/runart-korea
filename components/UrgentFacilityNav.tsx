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
  const[liveStarted,setLiveStarted]=useState(false),[menuOpen,setMenuOpen]=useState(false),[open,setOpen]=useState(false),[loading,setLoading]=useState<FacilityType|null>(null),[origin,setOrigin]=useState<UserPos|null>(null),[facilities,setFacilities]=useState<Facility[]>([]),[error,setError]=useState("");

  useEffect(()=>{setMenuOpen(false);setOpen(false);setLoading(null);setOrigin(null);setFacilities([]);setError("");setLiveStarted(false);},[pathname]);
  useEffect(()=>{
    if(!inLiveRun){setLiveStarted(false);return;}
    const sync=()=>setLiveStarted(!!document.querySelector(".runControlDock .runStopControl"));
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true});
    return()=>observer.disconnect();
  },[inLiveRun]);

  useEffect(()=>{if(!menuOpen&&!open)return;const close=(event:Event)=>{event.preventDefault();setMenuOpen(false);setOpen(false)};const key=(event:KeyboardEvent)=>{if(event.key==="Escape")close(event)};window.addEventListener("ttwittun:native-back",close);window.addEventListener("keydown",key);return()=>{window.removeEventListener("ttwittun:native-back",close);window.removeEventListener("keydown",key)}},[menuOpen,open]);

  function find(type:FacilityType){
    setMenuOpen(false);
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

  if(!inLiveRun||!liveStarted)return null;
  return <>
    {(menuOpen||open)&&<button className="urgentRunBackdrop" type="button" aria-label="긴급 시설 메뉴 닫기" onClick={()=>{setMenuOpen(false);setOpen(false)}}/>}
    <div className="urgentRunDock" aria-label="러닝 중 긴급 시설">
      <button className={`urgentRunFab ${menuOpen?"active":""}`} type="button" onClick={()=>{setMenuOpen(v=>!v);setOpen(false)}} aria-expanded={menuOpen}>SOS</button>
      {menuOpen&&<div className="urgentRunMenu">
        {(["toilet","water","convenience","parking"] as FacilityType[]).map(type=><button key={type} type="button" onClick={()=>find(type)}>{loading===type?"…":META[type].icon}<span>{META[type].label}</span></button>)}
      </div>}
    </div>
    {open&&<div className="urgentRunPanel" role="dialog" aria-modal="true" aria-label="주변 시설 길찾기">
      <button className="urgentRunClose" type="button" aria-label="닫기" onClick={()=>setOpen(false)}>×</button>
      <small>러닝 중 · 현재 위치 기준</small>
      {loading&&<p className="urgentRunLoading">{META[loading].icon} 가까운 {META[loading].label} 정보를 찾고 있어요…</p>}
      {error&&<p className="urgentRunError">{error}</p>}
      {facilities.map((f,i)=><div className="urgentFacilityItem" key={f.id}>
        <h3>{i+1}. {META[f.type].icon} {f.name}</h3>
        <p>직선거리 약 {distanceText(f.distance_m)}{f.address?` · ${f.address}`:""}</p>
        {f.opening_hours&&<small>운영시간 {f.opening_hours}</small>}
        {f.type==="water"&&i===0&&<small>현장 상태와 실제 이용 가능 여부는 시설 표기를 확인해주세요.</small>}
        <div><a href={kakaoDirections(f)} target="_blank" rel="noreferrer">카카오</a>{origin&&<a href={naverDirections(origin,f)} target="_blank" rel="noreferrer">네이버</a>}</div>
      </div>)}
      {!!facilities.length&&<p className="urgentRunNote">표시 거리는 직선거리입니다. 실제 이동거리·운영 여부는 지도 앱 또는 현장에서 확인해주세요.</p>}
    </div>}
  </>;
}
