"use client";
import {useEffect,useMemo,useState} from "react";

type Parking={id:string;name:string;address?:string|null;distance_m?:number|null;walking_minutes?:number|null;source_url?:string|null;latitude?:number|null;longitude?:number|null;public_likely?:boolean};
type ParkingData={configured:boolean;start?:{lat:number;lng:number}|null;parking:Parking[]};
function distanceLabel(m?:number|null){if(m==null)return "거리 미정";return m<1000?`${m}m`:`${(m/1000).toFixed(1)}km`;}
function kakaoToParking(p:Parking){return p.latitude!=null&&p.longitude!=null?`https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.latitude},${p.longitude}`:(p.source_url||"#");}
function kakaoWalk(start:{lat:number;lng:number},p:Parking){return `https://map.kakao.com/link/from/${encodeURIComponent(p.name)},${p.latitude},${p.longitude}/to/${encodeURIComponent("러닝 출발점")},${start.lat},${start.lng}`;}
function naverSearch(p:Parking){return `https://map.naver.com/p/search/${encodeURIComponent(p.name+(p.address?` ${p.address}`:""))}`;}
function openNaverCar(p:Parking){
 if(p.latitude==null||p.longitude==null)return window.open(naverSearch(p),"_blank");
 const scheme=`nmap://route/car?dlat=${p.latitude}&dlng=${p.longitude}&dname=${encodeURIComponent(p.name)}&appname=com.runart.korea`;
 const fallback=naverSearch(p);const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(!mobile)return window.open(fallback,"_blank");window.location.href=scheme;setTimeout(()=>{if(!document.hidden)window.location.href=fallback},1200);
}
function openNaverWalk(start:{lat:number;lng:number},p:Parking){
 if(p.latitude==null||p.longitude==null)return;
 const scheme=`nmap://route/walk?slat=${p.latitude}&slng=${p.longitude}&sname=${encodeURIComponent(p.name)}&dlat=${start.lat}&dlng=${start.lng}&dname=${encodeURIComponent("러닝 출발점")}&appname=com.runart.korea`;
 const fallback=`https://map.naver.com/p/search/${encodeURIComponent("러닝 출발점")}?c=${start.lng},${start.lat},16,0,0,0,dh`;const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(!mobile)return window.open(fallback,"_blank");window.location.href=scheme;setTimeout(()=>{if(!document.hidden)window.location.href=fallback},1200);
}

export default function RunStartFlow({courseId,courseName,startName}:{courseId:string;courseName:string;startName?:string|null}){
 const [data,setData]=useState<ParkingData|null>(null);const [selectedId,setSelectedId]=useState<string>("");
 useEffect(()=>{let cancelled=false;fetch(`/api/parking/nearby?courseId=${encodeURIComponent(courseId)}`,{cache:"no-store"}).then(r=>r.json()).then(d=>{if(cancelled)return;setData(d);if(d.parking?.[0]?.id)setSelectedId(d.parking[0].id)}).catch(()=>{if(!cancelled)setData({configured:false,parking:[]})});return()=>{cancelled=true}},[courseId]);
 const selected=useMemo(()=>data?.parking?.find(p=>p.id===selectedId)||data?.parking?.[0]||null,[data,selectedId]);
 const canWalk=!!(data?.start&&selected?.latitude!=null&&selected?.longitude!=null);
 return <section className="section" id="run-start">
  <div className="card" style={{padding:22}}><div className="sectionHead"><div><span className="eyebrow">START RUN</span><h2>🏁 지금 출발하기</h2><p className="muted">주차 → 출발점 이동 → 코스 열기까지 순서대로 진행하세요.</p></div><a className="btn" href={`/?course=${courseId}#explore`}>바로 코스 열기</a></div>
   {!data?<div className="muted">출발 준비 정보를 불러오는 중...</div>:<>
    {!!data.parking?.length&&<div style={{marginBottom:16}}><label className="muted" htmlFor="start-parking">1. 주차장 선택</label><select id="start-parking" value={selected?.id||""} onChange={e=>setSelectedId(e.target.value)} style={{width:"100%",marginTop:8}}>{data.parking.map(p=><option key={p.id} value={p.id}>{p.name} · {distanceLabel(p.distance_m)}{p.walking_minutes?` · 도보 ${p.walking_minutes}분`:""}</option>)}</select></div>}
    <div className="grid2">
     <div className="card"><span className="eyebrow">STEP 1</span><h3>🚗 주차장으로 이동</h3>{selected?<><p className="muted">{selected.name}<br/>{selected.address||"주소 정보 없음"}</p><div className="actions"><a className="btn" href={kakaoToParking(selected)} target="_blank" rel="noreferrer">카카오 내비/지도</a><button className="btn ghost" type="button" onClick={()=>openNaverCar(selected)}>네이버 자동차 길찾기</button><a className="btn ghost" href={naverSearch(selected)} target="_blank" rel="noreferrer">네이버 웹 검색</a></div></>:<p className="muted">추천 주차장이 없으면 출발점 주변 주차 가능 장소를 직접 확인해 주세요.</p>}</div>
     <div className="card"><span className="eyebrow">STEP 2</span><h3>🚶 출발점까지 이동</h3><p className="muted">{startName||courseName} 출발점{selected?.walking_minutes?` · 예상 도보 ${selected.walking_minutes}분`:""}</p>{canWalk?<div className="actions"><a className="btn" href={kakaoWalk(data!.start!,selected!)} target="_blank" rel="noreferrer">카카오 도보 길찾기</a><button className="btn ghost" type="button" onClick={()=>openNaverWalk(data!.start!,selected!)}>네이버 도보 길찾기</button></div>:<a className="btn ghost" href={`/?course=${courseId}#explore`}>출발점 지도 보기</a>}</div>
     <div className="card"><span className="eyebrow">STEP 3</span><h3>🏃 러닝 시작</h3><p className="muted">RUNART 지도에서 경로선·화장실·코스 정보를 확인하고 출발합니다.</p><a className="btn" href={`/?course=${courseId}#explore`}>러닝 코스 열기</a></div>
     <div className="card"><span className="eyebrow">STEP 4</span><h3>🍚 러닝 후</h3><p className="muted">완주 후 추천 맛집·카페와 RUN + EAT 일정을 이어서 확인할 수 있어요.</p><a className="btn ghost" href="#after-run">러닝 후 장소 보기</a></div>
    </div>
   </>}
  </div>
 </section>;
}
