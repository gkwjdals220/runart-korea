"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function RunTitleEditor({runId,initialTitle}:{runId:string;initialTitle:string}){
  const [name,setName]=useState(initialTitle);
  const [saved,setSaved]=useState(initialTitle);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  async function save(){
    const trimmed=name.trim();
    if(!trimmed){setMessage("기록 이름을 입력해주세요.");return}
    if(trimmed.length>60){setMessage("기록 이름은 60자 이하로 입력해주세요.");return}
    setSaving(true);setMessage("");
    const {error}=await createClient().from("runart_live_runs").update({run_title:trimmed}).eq("id",runId);
    if(error)setMessage(error.message||"이름 저장 중 오류가 발생했습니다.");
    else{setSaved(trimmed);setName(trimmed);setMessage("기록 이름을 변경했습니다.")}
    setSaving(false);
  }
  return <section className="section"><div className="card" style={{display:"grid",gap:9}}>
    <div><span className="eyebrow">RUN NAME</span><h3 style={{margin:"4px 0 0"}}>기록 이름 편집</h3></div>
    <input value={name} maxLength={60} autoComplete="off" enterKeyHint="done" onChange={e=>{setName(e.target.value);setMessage("")}} onKeyDown={e=>{if(e.key==="Enter"){e.currentTarget.blur();void save()}}} style={{width:"100%",minHeight:46,fontSize:16}}/>
    <div className="actions"><button className="btn" type="button" disabled={saving||!name.trim()||name.trim()===saved} onClick={save}>{saving?"저장 중…":"이름 저장"}</button></div>
    {message&&<p className="muted" role="status" aria-live="polite" style={{margin:0,fontSize:12}}>{message}</p>}
  </div></section>;
}
