"use client";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

const AUTH_BASE_URL="https://runart-korea.vercel.app";

export default function AuthForm(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
 const [resetEmail,setResetEmail]=useState(""); const [showReset,setShowReset]=useState(false);
 const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter(); const params=useSearchParams();
 useEffect(()=>{
   if(params.get("confirmed")==="1")setMsg("이메일 인증이 완료되었습니다. 이제 로그인해주세요.");
   if(params.get("reset")==="1")setMsg("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
   if(params.get("error")==="confirmation_failed")setMsg("인증 링크 처리에 실패했습니다. 인증 메일을 다시 보내주세요.");
   if(params.get("error")==="recovery_link_invalid")setMsg("비밀번호 재설정 링크를 확인할 수 없습니다. 비밀번호 찾기에서 새 메일을 다시 받아주세요.");
 },[params]);
 async function login(){
  if(!email.trim()||!password)return setMsg("이메일과 비밀번호를 입력해주세요.");
  setBusy(true);setMsg("");
  const sb=createClient(); const {data,error}=await sb.auth.signInWithPassword({email:email.trim(),password});
  if(error){setBusy(false);return setMsg(error.message)}
  const user=data.user;
  if(user){
    const displayName=name.trim() || (typeof user.user_metadata?.display_name==="string"?user.user_metadata.display_name.trim():"") || email.split("@")[0];
    await sb.from("runart_profiles").upsert({user_id:user.id,display_name:displayName},{onConflict:"user_id"});
  }
  setBusy(false);router.push("/dashboard"); router.refresh();
 }
 async function signup(){
  if(!email.trim()||!password)return setMsg("이메일과 비밀번호를 입력해주세요.");
  setBusy(true);setMsg("");
  const sb=createClient();
  const redirectTo=`${AUTH_BASE_URL}/auth/callback?next=/login?confirmed=1`;
  const {data,error}=await sb.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirectTo,data:{display_name:name.trim()||undefined}}});
  if(error){setBusy(false);return setMsg(error.message)}
  if(data.session && data.user && name.trim()){
    await sb.from("runart_profiles").upsert({user_id:data.user.id,display_name:name.trim()});
  }
  setBusy(false);setMsg("회원가입 요청 완료. 이메일의 인증 링크를 눌러 인증한 뒤 로그인해주세요.");
 }
 async function resend(){
  if(!email.trim())return setMsg("이메일 주소를 먼저 입력해주세요.");
  setBusy(true);setMsg("");
  const sb=createClient();
  const redirectTo=`${AUTH_BASE_URL}/auth/callback?next=/login?confirmed=1`;
  const {error}=await sb.auth.resend({type:"signup",email:email.trim(),options:{emailRedirectTo:redirectTo}});
  setBusy(false);setMsg(error?error.message:"인증 메일을 다시 보냈습니다. 가장 최근에 받은 메일의 링크를 사용해주세요.");
 }
 async function resetPassword(){
  const target=resetEmail.trim();
  if(!target)return setMsg("비밀번호를 재설정할 이메일 주소를 입력해주세요.");
  setBusy(true);setMsg("");
  const sb=createClient();
  const redirectTo=`${AUTH_BASE_URL}/auth/callback?next=/reset-password`;
  const {error}=await sb.auth.resetPasswordForEmail(target,{redirectTo});
  setBusy(false);
  setMsg(error?error.message:"비밀번호 재설정 메일을 보냈습니다. 메일의 링크를 눌러 새 비밀번호를 설정해주세요.");
 }
 function openReset(){setResetEmail(email.trim());setShowReset(true);setMsg("")}
 return <div className="stack">
   <label>이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" disabled={busy}/></label>
   <label>이메일<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" inputMode="email" placeholder="example@email.com" disabled={busy}/></label>
   <label>비밀번호<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" disabled={busy}/></label>
   <div className="actions"><button className="btn" onClick={login} disabled={busy}>로그인</button><button className="btn ghost" onClick={signup} disabled={busy}>회원가입</button><button className="btn ghost" onClick={resend} disabled={busy}>인증 메일 재발송</button></div>
   {!showReset?<button className="btn ghost" type="button" onClick={openReset} disabled={busy} style={{width:"100%"}}>비밀번호 찾기</button>:
   <div className="card" style={{display:"grid",gap:10,padding:14,marginTop:2}}>
    <div><b style={{display:"block",marginBottom:4}}>비밀번호 재설정</b><small className="muted">가입한 이메일 주소로 재설정 링크를 보내드립니다.</small></div>
    <label>재설정 이메일<input value={resetEmail} onChange={e=>setResetEmail(e.target.value)} type="email" autoComplete="email" inputMode="email" placeholder="가입한 이메일 주소" disabled={busy} style={{fontSize:16}}/></label>
    <div className="actions"><button className="btn" type="button" onClick={resetPassword} disabled={busy||!resetEmail.trim()}>{busy?"발송 중…":"재설정 메일 보내기"}</button><button className="btn ghost" type="button" onClick={()=>setShowReset(false)} disabled={busy}>취소</button></div>
   </div>}
   {msg&&<p className="muted" role="status" aria-live="polite">{msg}</p>}
 </div>
}
