"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
export default function CourseSubmit({userId}:{userId:string}){
 const [form,setForm]=useState({name:"",region:"경기",city:"안양",course_type:"normal",art_shape:"",distance_km:"5",route:""});
 const [gpx,setGpx]=useState<File|null>(null); const [msg,setMsg]=useState("");
 const change=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 async function submit(){
  const sb=createClient();
  let coords:any[]=[];
  try{
    coords=form.route.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{
      const [lat,lng]=line.split(",").map(Number); if(!isFinite(lat)||!isFinite(lng))throw new Error(); return [lng,lat];
    });
  }catch{return setMsg("경로는 위도,경도 형식으로 한 줄에 한 점씩 입력해주세요.");}
  if(coords.length<2)return setMsg("경로 포인트를 2개 이상 입력해주세요.");
  const {data:course,error}=await sb.from("runart_courses").insert({
    created_by:userId,name:form.name.trim(),region:form.region.trim(),city:form.city.trim(),
    course_type:form.course_type,art_shape:form.course_type==="art"?form.art_shape.trim()||null:null,
    distance_km:Number(form.distance_km),difficulty:2,night_recommended:true,
    route_geojson:{type:"LineString",coordinates:coords},status:"pending",source_name:"사용자 제보"
  }).select("id").single();
  if(error)return setMsg(error.message);
  if(gpx){
    const path=`submissions/${userId}/${course.id}/${Date.now()}-${gpx.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    const up=await sb.storage.from("runart-media").upload(path,gpx,{upsert:false});
    if(!up.error) await sb.from("runart_courses").update({gpx_path:path}).eq("id",course.id);
  }
  setMsg("코스 제보 완료. 관리자 승인 대기 상태로 저장했습니다.");
 }
 return <div className="card"><h3>새 코스 제보</h3>
  <div className="formgrid">
   <label>코스명<input value={form.name} onChange={e=>change("name",e.target.value)}/></label>
   <label>지역<input value={form.region} onChange={e=>change("region",e.target.value)}/></label>
   <label>도시<input value={form.city} onChange={e=>change("city",e.target.value)}/></label>
   <label>유형<select value={form.course_type} onChange={e=>change("course_type",e.target.value)}><option value="normal">일반</option><option value="art">그리기 런</option><option value="theme">테마런</option></select></label>
   {form.course_type==="art"&&<label>그림 이름<input value={form.art_shape} onChange={e=>change("art_shape",e.target.value)} placeholder="붕어빵"/></label>}
   <label>거리(km)<input type="number" step="0.01" value={form.distance_km} onChange={e=>change("distance_km",e.target.value)}/></label>
  </div>
  <label>경로 좌표<textarea value={form.route} onChange={e=>change("route",e.target.value)} placeholder={"37.3938,126.9561\n37.3988,126.9619\n37.4048,126.9707"}/></label>
  <label>GPX 파일(선택)<input type="file" accept=".gpx,application/gpx+xml" onChange={e=>setGpx(e.target.files?.[0]||null)}/></label>
  <button className="btn" onClick={submit}>승인 요청</button>{msg&&<p className="muted">{msg}</p>}
 </div>
}