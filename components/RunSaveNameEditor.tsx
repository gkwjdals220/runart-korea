"use client";

import {useEffect,useMemo,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "@/lib/supabase/client";

type RecentRun = {
  id:string;
  run_title:string|null;
  run_mode:string;
  finished_at:string;
  runart_courses?:{name?:string|null}|null;
};

function fallbackTitle(run:RecentRun){
  if(run.run_title?.trim())return run.run_title.trim();
  if(run.run_mode==="watch")return "Apple Watch 러닝";
  if(run.run_mode==="treadmill")return "트레드밀 러닝";
  if(run.run_mode==="track")return "트랙런";
  if(run.run_mode==="free")return "자유 러닝";
  return run.runart_courses?.name?.trim()||"코스 러닝";
}

export default function RunSaveNameEditor(){
  const sb=useMemo(()=>createClient(),[]);
  const [host,setHost]=useState<Element|null>(null);
  const [run,setRun]=useState<RecentRun|null>(null);
  const [name,setName]=useState("");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    let alive=true;
    let loadedFor:Element|null=null;
    async function load(target:Element){
      if(loadedFor===target)return;
      loadedFor=target;
      const {data:{user}}=await sb.auth.getUser();
      if(!alive||!user)return;
      const since=new Date(Date.now()-5*60*1000).toISOString();
      const {data}=await sb.from("runart_live_runs")
        .select("id,run_title,run_mode,finished_at,runart_courses(name)")
        .eq("user_id",user.id)
        .gte("finished_at",since)
        .order("finished_at",{ascending:false})
        .limit(1)
        .maybeSingle();
      if(!alive||!data)return;
      const recent=data as unknown as RecentRun;
      setRun(recent);
      setName(fallbackTitle(recent));
      setMessage("");
    }
    const inspect=()=>{
      const target=document.querySelector(".runCompleteCard");
      if(target){setHost(target);void load(target)}
      else{setHost(null);loadedFor=null;setRun(null);setMessage("")}
    };
    const observer=new MutationObserver(inspect);
    observer.observe(document.body,{subtree:true,childList:true});
    inspect();
    return()=>{alive=false;observer.disconnect()};
  },[sb]);

  async function save(){
    if(!run)return;
    const trimmed=name.trim();
    if(!trimmed){setMessage("기록 이름을 입력해주세요.");return}
    if(trimmed.length>60){setMessage("기록 이름은 60자 이하로 입력해주세요.");return}
    setSaving(true);setMessage("");
    const {error}=await sb.from("runart_live_runs").update({run_title:trimmed}).eq("id",run.id);
    if(error)setMessage(error.message||"이름 저장 중 오류가 발생했습니다.");
    else{setRun({...run,run_title:trimmed});setMessage("기록 이름을 저장했습니다.")}
    setSaving(false);
  }

  if(!host||!run)return null;
  return createPortal(
    <div className="runNameEditor" style={{margin:"14px 0 4px",padding:"14px",border:"1px solid rgba(217,243,95,.28)",borderRadius:16,background:"rgba(217,243,95,.045)"}}>
      <label style={{display:"grid",gap:7}}>
        <span className="eyebrow">RUN NAME</span>
        <b>기록 이름</b>
        <input
          value={name}
          maxLength={60}
          inputMode="text"
          autoComplete="off"
          enterKeyHint="done"
          onChange={e=>{setName(e.target.value);setMessage("")}}
          onKeyDown={e=>{if(e.key==="Enter"){e.currentTarget.blur();void save()}}}
          style={{width:"100%",minHeight:46,fontSize:16}}
          placeholder="예: 백운호수 야간런"
        />
      </label>
      <div className="actions" style={{marginTop:9}}>
        <button className="btn" type="button" disabled={saving||!name.trim()} onClick={save}>{saving?"저장 중…":"이름 저장"}</button>
      </div>
      {message&&<p className="muted" role="status" aria-live="polite" style={{margin:"8px 0 0",fontSize:12}}>{message}</p>}
    </div>,
    host
  );
}
