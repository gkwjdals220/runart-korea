"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
export default function AuthForm(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
 const [msg,setMsg]=useState(""); const router=useRouter();
 async function login(){
  const sb=createClient(); const {error}=await sb.auth.signInWithPassword({email,password});
  if(error)return setMsg(error.message); router.push("/dashboard"); router.refresh();
 }
 async function signup(){
  const sb=createClient(); const {data,error}=await sb.auth.signUp({email,password});
  if(error)return setMsg(error.message);
  if(data.user && name.trim()){
    await sb.from("runart_profiles").upsert({user_id:data.user.id,display_name:name.trim()});
  }
  setMsg("회원가입 요청 완료. Supabase 이메일 인증 설정에 따라 인증 메일을 확인해주세요.");
 }
 return <div className="stack">
   <label>이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="하정민"/></label>
   <label>이메일<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label>
   <label>비밀번호<input value={password} onChange={e=>setPassword(e.target.value)} type="password"/></label>
   <div className="actions"><button className="btn" onClick={login}>로그인</button><button className="btn ghost" onClick={signup}>회원가입</button></div>
   {msg&&<p className="muted">{msg}</p>}
 </div>
}