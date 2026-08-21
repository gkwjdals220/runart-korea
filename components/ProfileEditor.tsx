"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function ProfileEditor({userId,initialName}:{userId:string;initialName:string}){
 const [name,setName]=useState(initialName);const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);
 async function save(){
  const v=name.trim();if(!v)return setMsg("이름을 입력해주세요.");
  setSaving(true);const sb=createClient();
  const {error}=await sb.from("runart_profiles").upsert({user_id:userId,display_name:v,updated_at:new Date().toISOString()});
  setSaving(false);setMsg(error?error.message:"이름이 저장되었습니다. 새로고침하면 모든 화면에 반영됩니다.");
 }
 return <div className="card"><h3>내 프로필</h3><label>표시 이름<input value={name} maxLength={40} onChange={e=>setName(e.target.value)}/></label><button className="btn" disabled={saving} onClick={save}>{saving?"저장 중...":"이름 저장"}</button>{msg&&<p className="muted">{msg}</p>}</div>
}
