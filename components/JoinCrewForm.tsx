"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function JoinCrewForm({userId,crewId,initialStatus}:{userId:string;crewId:string;initialStatus:string|null}){
  const [message,setMessage]=useState("");
  const [status,setStatus]=useState(initialStatus);
  const [msg,setMsg]=useState("");

  async function apply(){
    const sb=createClient();
    const {error}=await sb.from("runart_crew_join_requests").upsert({crew_id:crewId,user_id:userId,message:message.trim()||null,status:"pending",updated_at:new Date().toISOString()},{onConflict:"crew_id,user_id"});
    if(error)return setMsg(error.message);
    setStatus("pending");setMsg("가입 신청을 보냈습니다. owner 승인 후 크루 기능이 열립니다.");
  }

  return <div className="card">
    <h3>뛰뚠뛰뚠 가입 신청</h3>
    <p className="muted">현재 상태: <b>{status||"미신청"}</b></p>
    <label>가입 메시지<textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="예: 러닝 참여하고 싶어요!"/></label>
    <button className="btn" onClick={apply}>{status==="pending"?"신청 내용 다시 보내기":"가입 신청"}</button>
    {msg&&<p className="muted">{msg}</p>}
  </div>;
}
