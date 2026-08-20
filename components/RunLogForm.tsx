"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Course={id:string,name:string,distance_km:number};
export default function RunLogForm({userId,crewId,courses}:{userId:string,crewId:string,courses:Course[]}){
 const [courseId,setCourseId]=useState(courses[0]?.id||""); const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [distance,setDistance]=useState(""); const [memo,setMemo]=useState(""); const [photo,setPhoto]=useState<File|null>(null); const [msg,setMsg]=useState("");
 async function save(){
  const sb=createClient(); const course=courses.find(c=>c.id===courseId);
  const {data:log,error}=await sb.from("runart_course_logs").insert({
    crew_id:crewId,course_id:courseId,created_by:userId,run_date:date,
    actual_distance_km:distance?Number(distance):course?.distance_km,memo:memo||null
  }).select("id").single();
  if(error)return setMsg(error.message);
  await sb.from("runart_log_participants").insert({log_id:log.id,user_id:userId});
  if(photo){
    const ext=photo.name.split(".").pop()||"jpg"; const path=`${crewId}/logs/${log.id}/${Date.now()}.${ext}`;
    const up=await sb.storage.from("runart-media").upload(path,photo,{upsert:false});
    if(!up.error) await sb.from("runart_course_logs").update({photo_path:path}).eq("id",log.id);
  }
  setMemo("");setDistance("");setPhoto(null);setMsg("수행 기록 저장 완료. 새로고침하면 통계에 반영됩니다.");
 }
 return <div className="card"><h3>오늘의 수행 기록</h3>
  <label>코스<select value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>날짜<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <label>실제 거리(km)<input type="number" step="0.01" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="비우면 코스 거리"/></label>
  <label>인증사진<input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
  <label>메모<textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="러닝 후 먹방까지 완료!"/></label>
  <button className="btn" onClick={save}>수행 기록 저장</button>{msg&&<p className="muted">{msg}</p>}
 </div>
}