"use client";
import {useEffect,useState} from "react";

type Parking={id:string;name:string;address?:string|null;distance_m?:number|null;walking_minutes?:number|null;source_url?:string|null;public_likely?:boolean;fee_status?:string;hours_status?:string;weekend_status?:string};
type ParkingData={configured:boolean;start?:{lat:number;lng:number}|null;parking:Parking[];note?:string};
function distanceLabel(m?:number|null){if(m==null)return "거리 미정";return m<1000?`${m}m`:`${(m/1000).toFixed(1)}km`;}

export default function ParkingRecommendations({courseId}:{courseId:string}){
 const [data,setData]=useState<ParkingData|null>(null);
 useEffect(()=>{fetch(`/api/parking/nearby?courseId=${courseId}`).then(r=>r.json()).then(setData).catch(()=>setData({configured:false,parking:[]}))},[courseId]);
 return <section className="section">
  <div className="sectionHead"><div><span className="eyebrow">START PARKING</span><h2>🚗 출발지 근처 공영주차장</h2><p className="muted">공영·공공 주차장을 우선으로 거리와 도보 접근성을 함께 비교합니다.</p></div></div>
  {!data?<div className="card muted">주차장을 찾는 중...</div>:<div className="placeRail">
   {(data.parking||[]).map(p=><article className="placeCard" key={p.id}>
    <div className="placeBadge">{p.public_likely?"공영 우선":"주차장"}</div><h3>{p.name}</h3><p className="muted">{p.address||"주소 정보 없음"}</p>
    <div className="metaRow"><span>📍 {distanceLabel(p.distance_m)}</span>{p.walking_minutes!=null&&<span>🚶 약 {p.walking_minutes}분</span>}</div>
    <div className="miniStats" style={{marginTop:12}}><span><b>{p.fee_status||"확인 필요"}</b>요금</span><span><b>{p.hours_status||"확인 필요"}</b>운영시간</span><span><b>{p.weekend_status||"확인 필요"}</b>주말</span></div>
    <div className="actions" style={{marginTop:12}}>{p.source_url&&<a className="btn ghost" href={p.source_url} target="_blank" rel="noreferrer">최신 주차정보 확인</a>}</div>
   </article>)}
   {!data.parking?.length&&<div className="card muted">출발지 2.5km 안에서 추천할 공영주차장을 찾지 못했습니다.{!data.configured&&" 장소 API 연결 상태도 확인이 필요합니다."}</div>}
  </div>}
  <p className="muted" style={{marginTop:10}}>※ 도보시간은 거리 기준 예상치입니다. 요금·운영시간·주말 개방·행사일 통제는 변동될 수 있어 상세 페이지의 최신 정보를 우선 확인해 주세요.</p>
 </section>;
}
