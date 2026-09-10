"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient as createSupabaseClient, type SupabaseClient} from "@supabase/supabase-js";

export default function ResetPasswordForm(){
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [msg,setMsg]=useState("재설정 링크를 확인하는 중입니다…");
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const sbRef=useRef<SupabaseClient|null>(null);
 const router=useRouter();

 if(!sbRef.current){
  sbRef.current=createSupabaseClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
   {auth:{flowType:"implicit",detectSessionInUrl:true,persistSession:true}}
  );
 }

 useEffect(()=>{
  let cancelled=false;
  const sb=sbRef.current!;
  async function init(){
   try{
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const accessToken=hash.get("access_token");
    const refreshToken=hash.get("refresh_token");
    const errorDescription=hash.get("error_description");
    if(errorDescription){
     if(!cancelled){setReady(false);setMsg(decodeURIComponent(errorDescription.replace(/\+/g," ")));}
     return;
    }
    if(accessToken&&refreshToken){
     const {error}=await sb.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
     if(error)throw error;
     history.replaceState(null,"",window.location.pathname+window.location.search);
    }
    const {data:{session},error}=await sb.auth.getSession();
    if(error||!session)throw error||new Error("재설정 세션을 확인할 수 없습니다. 비밀번호 찾기에서 새 메일을 다시 받아주세요.");
    if(!cancelled){setReady(true);setMsg("");}
   }catch(e:any){
    if(!cancelled){setReady(false);setMsg(e?.message||"재설정 링크를 확인할 수 없습니다. 비밀번호 찾기를 다시 진행해주세요.");}
   }
  }
  void init();
  return()=>{cancelled=true};
 },[]);

 async function save(){
  if(!ready)return setMsg("재설정 링크 확인이 완료되지 않았습니다. 가장 최근 메일의 링크로 다시 접속해주세요.");
  if(password.length<8)return setMsg("비밀번호는 8자 이상으로 입력해주세요.");
  if(password!==confirm)return setMsg("비밀번호가 서로 일치하지 않습니다.");
  setBusy(true);setMsg("");
  const sb=sbRef.current!;
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError||!session){setBusy(false);setReady(false);return setMsg("재설정 세션이 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.");}
  const {error}=await sb.auth.updateUser({password});
  if(error){setBusy(false);return setMsg(error.message||"비밀번호 변경 중 오류가 발생했습니다.");}
  await sb.auth.signOut();
  setBusy(false);
  router.replace("/login?reset=1");
  router.refresh();
 }
 return <div className="stack">
  <label>새 비밀번호<input type="password" value={password} onChange={e=>{setPassword(e.target.value);if(ready)setMsg("")}} autoComplete="new-password" disabled={busy||!ready}/></label>
  <label>새 비밀번호 확인<input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);if(ready)setMsg("")}} autoComplete="new-password" disabled={busy||!ready}/></label>
  <button className="btn" type="button" onClick={save} disabled={busy||!ready||!password||!confirm}>{busy?"변경 중…":ready?"비밀번호 변경":"링크 확인 중"}</button>
  {msg&&<p className="muted" role="status" aria-live="polite">{msg}</p>}
 </div>;
}
