"use client";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
export default function AuthForm(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
 const [msg,setMsg]=useState(""); const router=useRouter(); const params=useSearchParams();
 useEffect(()=>{
   if(params.get("confirmed")==="1")setMsg("이메일 인증이 완료되었습니다. 이제 로그인해주세요.");
   if(params.get("error")==="confirmation_failed")setMsg("인증 링크 처리에 실패했습니다. 새 인증 메일로 다시 시도해주세요.");
 },[params]);
 async function login(){
  const sb=createClient(); const {error}=await sb.auth.signInWithPassword({email,password});
  if(error)return setMsg(error.message); router.push("/dashboard"); router.refresh();
 }
 async function signup(){
  const sb=createClient();
  const redirectTo=`${window.location.origin}/auth/callback?next=/login?confirmed=1`;
  const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{display_name:name.trim()||undefined}}});
  if(error)return setMsg(error.message);
  if(data.session && data.user && name.trim()){
    await sb.from("runart_profiles").upsert({user_id:data.user.id,display_name:name.trim()});
  }
  setMsg("회원가입 요청 완료. 이메일의 인증 링크를 눌러 인증한 뒤 로그인해주세요.");
 }
 return <div className="stack">
   <label>이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="이름"/></label>
   <label>이메일<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label>
   <label>비밀번호<input value={password} onChange={e=>setPassword(e.target.value)} type="password"/></label>
   <div className="actions"><button className="btn" onClick={login}>로그인</button><button className="btn ghost" onClick={signup}>회원가입</button></div>
   {msg&&<p className="muted">{msg}</p>}
 </div>
}
