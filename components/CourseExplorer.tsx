"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";

type Course={
 id:string;name:string;region:string;city:string|null;course_type:string;art_shape:string|null;
 distance_km:number;difficulty:number;traffic_lights:number|null;toilets:number|null;
 night_recommended:boolean;route_geojson:any;tags:string[];surface:string|null;loop_type:string;
 verified:boolean;start_name:string|null;elevation_gain_m:number|null;data_quality:string;
};
type UserPos={lat:number;lng:number};
type Toilet={id:string;name:string;lat:number;lng:number;access?:string|null;wheelchair?:string|null;opening_hours?:string|null;fee?:string|null;source?:string};

function courseCenter(c:Course):UserPos|null{
 const coords=(c.route_geojson?.coordinates||[]).filter((x:any)=>Array.isArray(x)&&x.length>=2);
 if(!coords.length)return null;
 const sum=coords.reduce((a:any,x:any)=>({lng:a.lng+Number(x[0]),lat:a.lat+Number(x[1])}),{lng:0,lat:0});
 return {lng:sum.lng/coords.length,lat:sum.lat/coords.length};
}
function haversineKm(a:UserPos,b:UserPos){
 const R=6371,toRad=(v:number)=>v*Math.PI/180;
 const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
 const s=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
 return 2*R*Math.asin(Math.sqrt(s));
}

export default function CourseExplorer({courses,userId,favoriteIds=[]}:{courses:Course[];userId?:string|null;favoriteIds?:string[]}){
 const mapEl=useRef<HTMLDivElement|null>(null);const mapRef=useRef<any>(null);const layersRef=useRef<any[]>([]);const toiletLayersRef=useRef<any[]>([]);
 const [q,setQ]=useState("");const [region,setRegion]=useState("");const [type,setType]=useState("");const [distance,setDistance]=useState("");
 const [surface,setSurface]=useState("");const [loop,setLoop]=useState("");const [night,setNight]=useState(false);const [verified,setVerified]=useState(false);const [lowSignals,setLowSignals]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);const [mapReady,setMapReady]=useState(false);const [favorites,setFavorites]=useState(new Set(favoriteIds));const [msg,setMsg]=useState("");
 const [userPos,setUserPos]=useState<UserPos|null>(null);const [nearMode,setNearMode]=useState(false);const [locating,setLocating]=useState(false);
 const [showToilets,setShowToilets]=useState(true);const [toiletLoading,setToiletLoading]=useState(false);const [toiletCount,setToiletCount]=useState(0);
 const regions=useMemo(()=>Array.from(new Set(courses.map(c=>c.region))).sort(),[courses]);
 const surfaces=useMemo(()=>Array.from(new Set(courses.map(c=>c.surface).filter(Boolean) as string[])).sort(),[courses]);
 const distanceMap=useMemo(()=>{const m=new Map<string,number>();if(!userPos)return m;courses.forEach(c=>{const cc=courseCenter(c);if(cc)m.set(c.id,haversineKm(userPos,cc))});return m},[courses,userPos]);
 const filtered=useMemo(()=>{
  const rows=courses.filter(c=>{
   const text=`${c.name} ${c.region} ${c.city||""} ${c.art_shape||""} ${(c.tags||[]).join(" ")} ${c.start_name||""}`.toLowerCase();
   if(q&&!text.includes(q.toLowerCase()))return false;if(region&&c.region!==region)return false;if(type&&c.course_type!==type)return false;
   if(distance==="5"&&c.distance_km>6)return false;if(distance==="10"&&(c.distance_km<6||c.distance_km>12))return false;if(distance==="long"&&c.distance_km<12)return false;
   if(surface&&c.surface!==surface)return false;if(loop&&c.loop_type!==loop)return false;if(night&&!c.night_recommended)return false;if(verified&&!c.verified)return false;if(lowSignals&&(c.traffic_lights??99)>2)return false;
   if(nearMode&&userPos){const d=distanceMap.get(c.id);if(d==null||d>25)return false}return true;
  });
  if(userPos&&nearMode)rows.sort((a,b)=>(distanceMap.get(a.id)??9999)-(distanceMap.get(b.id)??9999));
  return rows;
 },[courses,q,region,type,distance,surface,loop,night,verified,lowSignals,nearMode,userPos,distanceMap]);
 const selectedCourse=useMemo(()=>courses.find(c=>c.id===selected)||null,[courses,selected]);
 useEffect(()=>{let cancelled=false;(async()=>{if(!mapEl.current||mapRef.current)return;const L=await import("leaflet");if(cancelled||!mapEl.current)return;const map=L.map(mapEl.current,{zoomControl:true}).setView([36.55,127.85],7);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);mapRef.current=map;setMapReady(true)})();return()=>{cancelled=true}},[]);
 useEffect(()=>{(async()=>{const map=mapRef.current;if(!map)return;const L=await import("leaflet");layersRef.current.forEach(x=>map.removeLayer(x));layersRef.current=[];const bounds:any[]=[];filtered.forEach(c=>{const coords=(c.route_geojson?.coordinates||[]).map((x:number[])=>[x[1],x[0]]);if(!coords.length)return;const line=L.polyline(coords,{weight:selected===c.id?7:4,opacity:selected===c.id?1:.72}).addTo(map);line.bindTooltip(`${c.name} · ${Number(c.distance_km).toFixed(1)}km`,{sticky:true});line.on("click",()=>setSelected(c.id));layersRef.current.push(line);coords.forEach((x:any)=>bounds.push(x))});if(bounds.length&&filtered.length<=8&&!selected)map.fitBounds(bounds,{padding:[25,25],maxZoom:14})})()},[filtered,selected,mapReady]);
 useEffect(()=>{let cancelled=false;(async()=>{const map=mapRef.current;if(!map)return;toiletLayersRef.current.forEach(x=>map.removeLayer(x));toiletLayersRef.current=[];setToiletCount(0);if(!showToilets||!selected)return;setToiletLoading(true);try{const r=await fetch(`/api/toilets?courseId=${encodeURIComponent(selected)}`);const data=await r.json();if(cancelled)return;const toilets=(data.toilets||[]) as Toilet[];const L=await import("leaflet");const icon=L.divIcon({className:"toiletMarker",html:"<span>🚻</span>",iconSize:[30,30],iconAnchor:[15,15]});toilets.forEach(t=>{const details=[t.opening_hours?`운영 ${t.opening_hours}`:null,t.fee?`요금 ${t.fee}`:null,t.wheelchair?`휠체어 ${t.wheelchair}`:null].filter(Boolean).join(" · ");const marker=L.marker([t.lat,t.lng],{icon}).addTo(map).bindPopup(`<b>${t.name}</b>${details?`<br/><small>${details}</small>`:""}<br/><small>OpenStreetMap 기반</small>`);toiletLayersRef.current.push(marker)});setToiletCount(toilets.length);if(data.warning)setMsg(data.warning)}catch{if(!cancelled)setMsg("화장실 위치를 불러오지 못했습니다.")}finally{if(!cancelled)setToiletLoading(false)}})();return()=>{cancelled=true}},[selected,showToilets,mapReady]);
 function locateMe(){
  const map=mapRef.current;if(!navigator.geolocation)return setMsg("현재 위치 기능을 사용할 수 없습니다.");setLocating(true);
  navigator.geolocation.getCurrentPosition(pos=>{const p={lat:pos.coords.latitude,lng:pos.coords.longitude};setUserPos(p);setNearMode(true);setLocating(false);setMsg("현재 위치에서 25km 이내 코스를 가까운 순으로 보여드려요.");if(map)map.setView([p.lat,p.lng],11)},()=>{setLocating(false);setMsg("위치 권한을 허용하면 내 주변 코스를 추천할 수 있습니다.")},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
 }
 async function toggleFavorite(courseId:string){
  if(!userId){setMsg("찜하기는 로그인 후 사용할 수 있습니다.");return}
  const sb=createClient();const next=new Set(favorites);
  if(next.has(courseId)){const {error}=await sb.from("runart_favorites").delete().eq("user_id",userId).eq("course_id",courseId);if(error)return setMsg(error.message);next.delete(courseId)}
  else{const {error}=await sb.from("runart_favorites").insert({user_id:userId,course_id:courseId});if(error)return setMsg(error.message);next.add(courseId)}
  setFavorites(next);setMsg("");
 }
 return <div className="explorer" id="explore"><div className="exploreTitle"><div><span className="eyebrow">EXPLORE</span><h2>내 취향대로 코스 찾기</h2></div><span className="muted">검색 · 내 주변 · 필터 · 지도</span></div><div className="filterbar">
  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="지역, 코스명, 태그로 검색해보세요"/>
  <button className={`chip ${nearMode?"on":""}`} onClick={()=>nearMode?setNearMode(false):locateMe()}>{locating?"위치 찾는 중…":nearMode?"◎ 내 주변 ON":"◎ 내 주변"}</button>
  <button className={`chip ${showToilets?"on":""}`} onClick={()=>{if(!selected&&!showToilets)setMsg("먼저 지도나 목록에서 코스를 선택해주세요.");setShowToilets(v=>!v)}}>{toiletLoading?"🚻 찾는 중…":showToilets?`🚻 화장실 ON${selected?` ${toiletCount}`:""}`:"🚻 화장실"}</button>
  <select value={region} onChange={e=>setRegion(e.target.value)}><option value="">전국</option>{regions.map(r=><option key={r}>{r}</option>)}</select>
  <select value={type} onChange={e=>setType(e.target.value)}><option value="">전체 유형</option><option value="normal">일반</option><option value="art">그리기 런 🎨</option><option value="theme">테마런</option></select>
  <select value={distance} onChange={e=>setDistance(e.target.value)}><option value="">거리 전체</option><option value="5">약 5K</option><option value="10">약 10K</option><option value="long">12K+</option></select>
  <select value={surface} onChange={e=>setSurface(e.target.value)}><option value="">노면 전체</option>{surfaces.map(x=><option key={x}>{x}</option>)}</select>
  <select value={loop} onChange={e=>setLoop(e.target.value)}><option value="">형태 전체</option><option value="loop">순환</option><option value="out_back">왕복</option><option value="point_to_point">편도</option></select>
  <button className={`chip ${verified?"on":""}`} onClick={()=>setVerified(v=>!v)}>✓ 검증</button><button className={`chip ${night?"on":""}`} onClick={()=>setNight(v=>!v)}>🌙 야간</button><button className={`chip ${lowSignals?"on":""}`} onClick={()=>setLowSignals(v=>!v)}>🚦 신호 적음</button>
 </div>{msg&&<p className="muted">{msg}</p>}<div className="mapLayout"><div className="mapPanel"><div ref={mapEl} className="courseMap"/>{selectedCourse&&<div className="mapCourseInfo"><button className="mapCourseClose" aria-label="선택 해제" onClick={()=>setSelected(null)}>×</button><div className="mapCourseTitle"><div><small>{selectedCourse.region} {selectedCourse.city||""}</small><h3>{selectedCourse.name}</h3>{selectedCourse.start_name&&<p>📍 출발 {selectedCourse.start_name}</p>}</div><strong>{Number(selectedCourse.distance_km).toFixed(1)}K</strong></div><div className="mapCourseStats"><span>난이도 {"★".repeat(selectedCourse.difficulty||2)}</span><span>🚦 {selectedCourse.traffic_lights??"-"}</span><span>🚻 {showToilets?toiletCount:(selectedCourse.toilets??"-")}</span>{selectedCourse.elevation_gain_m!=null&&<span>↗ {selectedCourse.elevation_gain_m}m</span>}{selectedCourse.night_recommended&&<span>🌙 야간추천</span>}</div><div className="mapCourseTags">{(selectedCourse.tags||[]).slice(0,3).map(t=><span key={t}>#{t}</span>)}</div><div className="mapCourseActions"><Link href={`/courses/${selectedCourse.id}`}>코스 상세 보기</Link><button onClick={()=>toggleFavorite(selectedCourse.id)}>{favorites.has(selectedCourse.id)?"♥ 찜됨":"♡ 찜하기"}</button></div></div>}<p className="mapDataNote">🚻 화장실 위치는 선택한 코스 주변의 OpenStreetMap 공공 데이터를 기준으로 표시되며 실제 운영 여부와 다를 수 있습니다.</p></div><div className="courseList"><div className="listHead"><b>{filtered.length}개 코스</b><span className="muted">{nearMode?"가까운 순":"RUNART Discovery"}</span></div>
 {filtered.map(c=>{const away=distanceMap.get(c.id);return <article key={c.id} className={`courseCard ${selected===c.id?"selected":""}`} onClick={()=>setSelected(c.id)}><div className="courseTop"><div><h3>{c.name} {c.verified&&<span className="done">✓</span>}</h3><p className="muted">{c.region} {c.city||""}{c.start_name?` · ${c.start_name}`:""}{nearMode&&away!=null?` · 내 위치 ${away.toFixed(1)}km`:""}</p></div><div className="courseCardActions"><b>{Number(c.distance_km).toFixed(1)}K</b><button aria-label="찜하기" className={`iconHeart ${favorites.has(c.id)?"saved":""}`} onClick={e=>{e.stopPropagation();toggleFavorite(c.id)}}>{favorites.has(c.id)?"♥":"♡"}</button></div></div><div className="metaRow">{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape||"GPS ART"}</span>}<span>난이도 {"★".repeat(c.difficulty||2)}</span>{c.surface&&<span>노면 {c.surface}</span>}{c.elevation_gain_m!=null&&<span>↗ {c.elevation_gain_m}m</span>}<span>🚦 {c.traffic_lights??"-"}</span><span>🚻 {selected===c.id&&showToilets?toiletCount:(c.toilets??"-")}</span>{c.night_recommended&&<span>🌙</span>}</div><div className="metaRow">{(c.tags||[]).slice(0,4).map(t=><span className="tag" key={t}>#{t}</span>)}</div><Link href={`/courses/${c.id}`} className="textLink" onClick={e=>e.stopPropagation()}>코스 상세 · 주변 맛집 →</Link></article>})}{!filtered.length&&<div className="empty">조건에 맞는 코스가 없습니다.</div>}</div></div></div>
}
