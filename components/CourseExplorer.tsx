"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";

type Course={
 id:string;name:string;region:string;city:string|null;course_type:string;
 art_shape:string|null;distance_km:number;difficulty:number;traffic_lights:number|null;
 toilets:number|null;night_recommended:boolean;route_geojson:any;
 rating_avg?:number;review_count?:number;
};

export default function CourseExplorer({courses}:{courses:Course[]}){
 const mapEl=useRef<HTMLDivElement|null>(null);
 const mapRef=useRef<any>(null);
 const layersRef=useRef<any[]>([]);
 const [q,setQ]=useState("");
 const [region,setRegion]=useState("");
 const [type,setType]=useState("");
 const [distance,setDistance]=useState("");
 const [night,setNight]=useState(false);
 const [lowSignals,setLowSignals]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);\n const [mapReady,setMapReady]=useState(false);

 const regions=useMemo(()=>Array.from(new Set(courses.map(c=>c.region))).sort(),[courses]);
 const filtered=useMemo(()=>courses.filter(c=>{
   const text=`${c.name} ${c.region} ${c.city||""} ${c.art_shape||""}`.toLowerCase();
   if(q && !text.includes(q.toLowerCase())) return false;
   if(region && c.region!==region) return false;
   if(type && c.course_type!==type) return false;
   if(distance==="5" && c.distance_km>6) return false;
   if(distance==="10" && (c.distance_km<6 || c.distance_km>12)) return false;
   if(distance==="long" && c.distance_km<12) return false;
   if(night && !c.night_recommended) return false;
   if(lowSignals && (c.traffic_lights??99)>2) return false;
   return true;
 }),[courses,q,region,type,distance,night,lowSignals]);

 useEffect(()=>{
   let cancelled=false;
   (async()=>{
     if(!mapEl.current || mapRef.current) return;
     const L=await import("leaflet");
     if(cancelled || !mapEl.current) return;
     const map=L.map(mapEl.current,{zoomControl:true}).setView([36.55,127.85],7);
     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
       maxZoom:19,attribution:"© OpenStreetMap"
     }).addTo(map);
     mapRef.current=map;\n     setMapReady(true);
   })();
   return()=>{cancelled=true};
 },[]);

 useEffect(()=>{
   (async()=>{
     const map=mapRef.current;
     if(!map) return;
     const L=await import("leaflet");
     layersRef.current.forEach(x=>map.removeLayer(x));
     layersRef.current=[];
     const bounds:any[]=[];
     filtered.forEach(c=>{
       const coords=(c.route_geojson?.coordinates||[]).map((x:number[])=>[x[1],x[0]]);
       if(!coords.length) return;
       const line=L.polyline(coords,{
         weight:selected===c.id?7:4,
         opacity:selected===c.id?1:.72
       }).addTo(map);
       line.bindTooltip(`${c.name} · ${Number(c.distance_km).toFixed(1)}km`);
       line.on("click",()=>setSelected(c.id));
       layersRef.current.push(line);
       coords.forEach((x:any)=>bounds.push(x));
     });
     if(bounds.length && filtered.length<=8){
       map.fitBounds(bounds,{padding:[25,25],maxZoom:14});
     }
   })();
 },[filtered,selected,mapReady]);

 function locateMe(){
   const map=mapRef.current;
   if(!map || !navigator.geolocation) return alert("현재 위치 기능을 사용할 수 없습니다.");
   navigator.geolocation.getCurrentPosition(
     pos=>map.setView([pos.coords.latitude,pos.coords.longitude],14),
     ()=>alert("위치 권한을 확인해주세요.")
   );
 }

 return <div className="explorer">
   <div className="filterbar">
     <input value={q} onChange={e=>setQ(e.target.value)} placeholder="코스명·지역·그림 검색"/>
     <select value={region} onChange={e=>setRegion(e.target.value)}>
       <option value="">전국</option>{regions.map(r=><option key={r}>{r}</option>)}
     </select>
     <select value={type} onChange={e=>setType(e.target.value)}>
       <option value="">전체 유형</option><option value="normal">일반</option>
       <option value="art">그리기 런 🎨</option><option value="theme">테마런</option>
     </select>
     <select value={distance} onChange={e=>setDistance(e.target.value)}>
       <option value="">거리 전체</option><option value="5">약 5K</option>
       <option value="10">약 10K</option><option value="long">12K+</option>
     </select>
     <button className={`chip ${night?"on":""}`} onClick={()=>setNight(v=>!v)}>🌙 야간추천</button>
     <button className={`chip ${lowSignals?"on":""}`} onClick={()=>setLowSignals(v=>!v)}>🚦 신호 적음</button>
     <button className="chip" onClick={locateMe}>◎ 내 위치</button>
   </div>

   <div className="mapLayout">
     <div className="mapPanel"><div ref={mapEl} className="courseMap"/></div>
     <div className="courseList">
       <div className="listHead"><b>{filtered.length}개 코스</b><span className="muted">지도 선을 눌러도 선택됩니다</span></div>
       {filtered.map(c=><article key={c.id} className={`courseCard ${selected===c.id?"selected":""}`} onClick={()=>setSelected(c.id)}>
         <div className="courseTop">
           <div><h3>{c.name}</h3><p className="muted">{c.region} {c.city||""}</p></div>
           <b>{Number(c.distance_km).toFixed(1)}K</b>
         </div>
         <div className="metaRow">
           {c.course_type==="art"&&<span className="tag">🎨 {c.art_shape||"GPS ART"}</span>}
           <span>난이도 {"★".repeat(c.difficulty||2)}</span>
           <span>🚦 {c.traffic_lights??"-"}</span>
           <span>🚻 {c.toilets??"-"}</span>
           {c.night_recommended&&<span>🌙</span>}
         </div>
         <Link href={`/courses/${c.id}`} className="textLink" onClick={e=>e.stopPropagation()}>코스 상세 →</Link>
       </article>)}
       {!filtered.length&&<div className="empty">조건에 맞는 코스가 없습니다.</div>}
     </div>
   </div>
 </div>
}
