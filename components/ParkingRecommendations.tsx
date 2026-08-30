"use client";
import {useEffect,useState} from "react";

type Parking={id:string;name:string;address?:string|null;distance_m?:number|null;walking_minutes?:number|null;source_url?:string|null;public_likely?:boolean;fee_status?:string;hours_status?:string;weekend_status?:string;latitude?:number|null;longitude?:number|null};
type ParkingData={configured:boolean;start?:{lat:number;lng:number}|null;parking:Parking[];note?:string};
function distanceLabel(m?:number|null){if(m==null)return "거리 미정";return m<1000?`${m}m`:`${(m/1000).toFixed(1)}km`;}
function kakaoWalk(start:{lat:number;lng:number},p:Parking){const s=encodeURIComponent(p.name);return `https://map.kakao.com/link/from/${s},${p.latitude},${p.longitude}/to/러닝 출발점,${start.lat},${start.lng}`}
function naverSearch(p:Parking){return `https://map.naver.com/p/search/${encodeURIComponent(p.name+(p.address?` ${p.address}`:""))}`;}
function openNaverWalk(start:{lat:number;lng:number},p:Parking){
 if(p.latitude==null||p.longitude==null)return window.open(naverSearch(p),"_blank");
 const scheme=`nmap://route/walk?slat=${p.latitude}&slng=${p.longitude}&sname=${encodeURIComponent(p.name)}&dlat=${start.lat}&dlng=${start.lng}&dname=${encodeURIComponent("러닝 출발점")}&appname=com.runart.korea`;
 const fallback=`https://map.naver.com/p/search/${encodeURIComponent("러닝 출발점")}?c=${start.lng},${start.lat},16,0,0,0,dh`;
 const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(!mobile)return window.open(fallback,"_blank");
 window.location.href=scheme;
 setTimeout(()=>{if(!document.hidden)window.location.href=fallback},1200);
}

export default function ParkingRecommendations({courseId}:{courseId:string}){
 const [data,setData]=useState<ParkingData|null>(null);
 useEffect(()=>{fetch(`/api/parking/nearby?courseId=${courseId}`).then(r=>r.json()).then(setData).catch(()=>setData({configured:false,parking:[]}))},[courseId]);
 return <section className="section" id="parking">
  <div className="sectionHead"><div><span className="eyebrow">START PARKING</span><h2>🚗 출발지 근처 공영주차장</h2><p className="muted">공영·공공 주차장을 우선으로 거리와 도보 접근성을 함께 비교합니다.</p></div></div>
  {!data?<div className="card muted">주차장을 찾는 중...</div>:<div className="placeRail">
   {(data.parking||[]).map(p=><article className="placeCard" key={p.id}>
    <div className="placeBadge">{p.public_likely?"공영 우선":"주차장"}</div><h3>{p.name}</h3><p className="muted">{p.address||"주소 정보 없음"}</p>
    <div className="metaRow"><span>📍 {distanceLabel(p.distance_m)}</span>{p.walking_minutes!=null&&<span>🚶 출발점까지 약 {p.walking_minutes}분</span>}</div>
    <div className="miniStats" style={{marginTop:12}}><span><b>{p.fee_status||"확인 필요"}</b>요금</span><span><b>{p.hours_status||"확인 필요"}</b>운영시간</span><span><b>{p.weekend_status||"확인 필요"}</b>주말</span></div>
    <div className="actions" style={{marginTop:12}}>{data.start&&p.latitude!=null&&p.longitude!=null&&<a className="btn" href={kakaoWalk(data.start,p)} target="_blank" rel="noreferrer">카카오 도보 길찾기</a>}{data.start&&<button className="btn ghost" type="button" onClick={()=>openNaverWalk(data.start!,p)}>네이버 도보 길찾기</button>}<a className="btn ghost" href={naverSearch(p)} target="_blank" rel="noreferrer">네이버에서 주차장 찾기</a>{p.source_url&&<a className="btn ghost" href={p.source_url} target="_blank" rel="noreferrer">주차장 상세</a>}</div>
   </article>)}
   {!data.parking?.length&&<div className="card muted">출발지 2.5km 안에서 추천할 공영주차장을 찾지 못했습니다.{!data.configured&&" 장소 API 연결 상태도 확인이 필요합니다."}</div>}
  </div>}
  <p className="muted" style={{marginTop:10}}>※ 네이버 도보 길찾기는 모바일에서 네이버지도 앱을 우선 호출하고, 앱 호출이 되지 않으면 웹 지도로 연결합니다. 도보시간·요금·운영시간은 방문 전 최신 정보를 확인해 주세요.</p>
 </section>;
}
