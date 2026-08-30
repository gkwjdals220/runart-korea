"use client";
import {useEffect,useState} from "react";

type Parking={id:string;name:string;address?:string|null;distance_m?:number|null;source_url?:string|null;public_likely?:boolean};
type ParkingData={configured:boolean;start?:{lat:number;lng:number}|null;parking:Parking[]};

function distanceLabel(m?:number|null){
 if(m==null)return "거리 미정";
 return m<1000?`${m}m`:`${(m/1000).toFixed(1)}km`;
}

export default function ParkingRecommendations({courseId}:{courseId:string}){
 const [data,setData]=useState<ParkingData|null>(null);
 useEffect(()=>{
  fetch(`/api/parking/nearby?courseId=${courseId}`)
   .then(r=>r.json()).then(setData)
   .catch(()=>setData({configured:false,parking:[]}));
 },[courseId]);

 return <section className="section">
  <div className="sectionHead"><div><span className="eyebrow">START PARKING</span><h2>🚗 출발지 근처 공영주차장</h2><p className="muted">코스 출발점에서 가까운 공영·공공 주차장을 우선 추천합니다.</p></div></div>
  {!data?<div className="card muted">주차장을 찾는 중...</div>:
   <div className="placeRail">
    {(data.parking||[]).map(p=><article className="placeCard" key={p.id}>
      <div className="placeBadge">{p.public_likely?"공영 우선":"주차장"}</div>
      <h3>{p.name}</h3>
      <p className="muted">{p.address||"주소 정보 없음"}</p>
      <div className="metaRow"><span>출발점 기준 {distanceLabel(p.distance_m)}</span></div>
      <div className="actions">{p.source_url&&<a className="btn ghost" href={p.source_url} target="_blank" rel="noreferrer">지도에서 보기</a>}</div>
    </article>)}
    {!data.parking?.length&&<div className="card muted">출발지 2.5km 안에서 추천할 공영주차장을 찾지 못했습니다.{!data.configured&&" 장소 API 연결 상태도 확인이 필요합니다."}</div>}
   </div>}
  <p className="muted" style={{marginTop:10}}>주차요금·운영시간·행사일 통제 여부는 방문 전 해당 주차장 상세정보에서 확인해 주세요.</p>
 </section>;
}
