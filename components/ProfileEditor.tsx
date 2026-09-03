"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import TtwittunButtonIcon from "@/components/TtwittunButtonIcon";

export default function ProfileEditor({userId,initialName}:{userId:string;initialName:string}){
 const [name,setName]=useState(initialName);const [savedName,setSavedName]=useState(initialName.trim());const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);
 async function save(){
  const v=name.trim();if(!v)return setMsg("표시 이름을 입력해주세요.");if(v===savedName)return setMsg("변경된 이름이 없습니다.");
  setSaving(true);setMsg("");const sb=createClient();
  try{const {error}=await sb.from("runart_profiles").upsert({user_id:userId,display_name:v,updated_at:new Date().toISOString()});if(error)throw error;setName(v);setSavedName(v);setMsg("표시 이름을 저장했습니다.");}
  catch(e:any){setMsg(e?.message||"이름 저장 중 오류가 발생했습니다.")}finally{setSaving(false)}
 }
 const unchanged=name.trim()===savedName;
 return <div className="card profileEditorCard"><div><span className="eyebrow">DISPLAY NAME</span><h3>내 프로필</h3></div><label>표시 이름<input value={name} maxLength={40} disabled={saving} autoComplete="nickname" onChange={e=>{setName(e.target.value);setMsg("")}}/></label><small className="muted profileNameHint">러닝 기록과 크루 화면에 표시됩니다.</small><button className="btn" type="button" disabled={saving||unchanged||!name.trim()} onClick={save}><TtwittunButtonIcon name="save" compact/>{saving?"저장 중…":unchanged?"현재 이름":"이름 저장"}</button>{msg&&<p className="muted formStatus" role="status" aria-live="polite">{msg}</p>}</div>
}
