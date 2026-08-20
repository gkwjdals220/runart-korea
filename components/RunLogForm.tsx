"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
type Course={id:string,name:string,distance_km:number};
type Member={user_id:string,display_name:string,role:string};
export default function RunLogForm({userId,crewId,courses,members}:{userId:string,crewId:string,courses:Course[],members:Member[]}){
 const router=useRouter();
 const [courseId,setCourseId]=useState(courses[0]?.id||""); const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [distance,setDistance]=useState(""); const [memo,setMemo]=useState(""); const [photo,setPhoto]=useState<File|null>(null); const [msg,setMsg]=useState("");
 const [participants,setParticipants]=useState<string[]>([userId]);
 function toggleParticipant(id:string){setParticipants(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 async function save(){
  setMsg("");
  if(!courseId)return setMsg("코스를 선택해주세요.");
  if(!participants.length)return setMsg("참여 크루원을 1명 이상 선택해주세요.");
  const sb=createClient(); const course=courses.find(c=>c.id===courseId);
  const {data:log,error}=await sb.from("runart_course_logs").insert({
    crew_id:crewId,course_id:courseId,created_by:userId,run_date:date,
    actual_distance_km:distance?Number(distance):course?.distance_km,memo:memo||null
  }).select("id").single();
  if(error)return setMsg(error.message);
  const unique=Array.from(new Set(participants));
  const participantInsert=await sb.from("runart_log_participants").insert(unique.map(id=>({log_id:log.id,user_id:id})));
  if(participantInsert.error)return setMsg(`러닝은 저장됐지만 참여자 저장 실패: ${participantInsert.error.message}`);
  if(photo){
    const ext=photo.name.split(".").pop()||"jpg"; const path=`${crewId}/logs/${log.id}/${Date.now()}.${ext}`;
    const up=await sb.storage.from("runart-media").upload(path,photo,{upsert:false});
    if(!up.error) await sb.from("runart_course_logs").update({photo_path:path}).eq("id",log.id);
  }
  setMemo("");setDistance("");setPhoto(null);setParticipants([userId]);setMsg("수행 기록과 참여자 출석이 저장되었습니다.");
  router.refresh();
 }
 return <div className="card"><h3>러닝 수행 기록</h3>
  <label>코스<select value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>날짜<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <label>실제 거리(km)<input type="number" step="0.01" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="비우면 코스 거리"/></label>
  <div className="memberPicker"><div className="pickerTitle"><b>참여 크루원</b><span>{participants.length}명 선택</span></div><div className="memberCheckGrid">{members.map(m=><label className={`memberCheck ${participants.includes(m.user_id)?"checked":""}`} key={m.user_id}><input type="checkbox" checked={participants.includes(m.user_id)} onChange={()=>toggleParticipant(m.user_id)}/><span><b>{m.display_name}</b><small>{m.role}</small></span></label>)}</div></div>
  <label>인증사진<input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
  <label>메모<textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="러닝 후 먹방까지 완료!"/></label>
  <button className="btn" onClick={save}>수행 + 참여자 저장</button>{msg&&<p className="muted">{msg}</p>}
 </div>
}