"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

type Course={id:string,name:string,distance_km:number};
type Member={user_id:string;display_name:string;role:string};

export default function RunLogForm({userId,crewId,courses,members,role}:{userId:string;crewId:string;courses:Course[];members:Member[];role:string}){
 const router=useRouter();
 const canManage=["owner","admin"].includes(role);
 const [courseId,setCourseId]=useState(courses[0]?.id||"");
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [distance,setDistance]=useState("");
 const [memo,setMemo]=useState("");
 const [photo,setPhoto]=useState<File|null>(null);
 const [selected,setSelected]=useState<string[]>([userId]);
 const [msg,setMsg]=useState("");
 const [saving,setSaving]=useState(false);
 const selectedCount=useMemo(()=>selected.length,[selected]);

 function toggle(id:string){
   if(!canManage && id!==userId)return;
   setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
 }

 async function save(){
  if(!courseId)return setMsg("코스를 선택해주세요.");
  if(!selected.length)return setMsg("참여 크루원을 1명 이상 선택해주세요.");
  setSaving(true);setMsg("");
  const sb=createClient(); const course=courses.find(c=>c.id===courseId);
  const {data:log,error}=await sb.from("runart_course_logs").insert({
    crew_id:crewId,course_id:courseId,created_by:userId,run_date:date,
    actual_distance_km:distance?Number(distance):course?.distance_km,memo:memo||null
  }).select("id").single();
  if(error){setSaving(false);return setMsg(error.message)}
  const rows=selected.map(uid=>({log_id:log.id,user_id:uid}));
  const {error:participantError}=await sb.from("runart_log_participants").insert(rows);
  if(participantError){
    await sb.from("runart_course_logs").delete().eq("id",log.id);
    setSaving(false);return setMsg("참여자 저장 실패: "+participantError.message);
  }
  if(photo){
    const ext=photo.name.split(".").pop()||"jpg"; const path=`${crewId}/logs/${log.id}/${Date.now()}.${ext}`;
    const up=await sb.storage.from("runart-media").upload(path,photo,{upsert:false});
    if(!up.error) await sb.from("runart_course_logs").update({photo_path:path}).eq("id",log.id);
  }
  setMemo("");setDistance("");setPhoto(null);setSelected([userId]);setSaving(false);
  setMsg(`수행 기록 저장 완료 · ${selectedCount}명 참여`);
  router.refresh();
 }

 return <div className="card"><h3>러닝 수행 기록</h3>
  <p className="muted">러닝 날짜와 코스, 실제 참여 크루원을 함께 기록합니다.</p>
  <label>코스<select value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <div className="formgrid"><label>날짜<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
  <label>실제 거리(km)<input type="number" step="0.01" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="비우면 코스 거리"/></label></div>
  <div className="attendanceBox"><div className="listHead"><b>참여 크루원</b><span className="muted">{selectedCount}명 선택</span></div>
   <div className="attendanceGrid">{members.map(m=><label className={`memberCheck ${selected.includes(m.user_id)?"checked":""}`} key={m.user_id}>
    <input type="checkbox" checked={selected.includes(m.user_id)} disabled={!canManage&&m.user_id!==userId} onChange={()=>toggle(m.user_id)}/>
    <span><b>{m.display_name}</b><small>{m.role}</small></span>
   </label>)}</div>
   {!canManage&&<small className="muted">member 계정은 본인 참여만 기록할 수 있고, owner/admin은 전체 출석을 체크할 수 있습니다.</small>}
  </div>
  <label>인증사진<input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
  <label>메모<textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="정기런, 펀런, 먹방런 등 메모를 남겨주세요."/></label>
  <button className="btn" disabled={saving} onClick={save}>{saving?"저장 중...":`수행 기록 저장 (${selectedCount}명)`}</button>{msg&&<p className="muted">{msg}</p>}
 </div>
}
