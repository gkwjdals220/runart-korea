"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export default function ResetPasswordForm(){
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [msg,setMsg]=useState("");
 const [busy,setBusy]=useState(false);
 const router=useRouter();
 async function save(){
  if(password.length<8)return setMsg("비밀번호는 8자 이상으로 입력해주세요.");
  if(password!==confirm)return setMsg("비밀번호가 서로 일치하지 않습니다.");
  setBusy(true);setMsg("");
  const sb=createClient();
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError||!session){setBusy(false);return setMsg("재설정 세션을 확인할 수 없습니다. 비밀번호 찾기를 다시 진행해주세요.");}
  const {error}=await sb.auth.updateUser({password});
  if(error){setBusy(false);return setMsg(error.message||"비밀번호 변경 중 오류가 발생했습니다.");}
  await sb.auth.signOut();
  setBusy(false);
  router.replace("/login?reset=1");
  router.refresh();
 }
 return <div className="stack">
  <label>새 비밀번호<input type="password" value={password} onChange={e=>{setPassword(e.target.value);setMsg("")}} autoComplete="new-password" disabled={busy}/></label>
  <label>새 비밀번호 확인<input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setMsg("")}} autoComplete="new-password" disabled={busy}/></label>
  <button className="btn" type="button" onClick={save} disabled={busy||!password||!confirm}>{busy?"변경 중…":"비밀번호 변경"}</button>
  {msg&&<p className="muted" role="status" aria-live="polite">{msg}</p>}
 </div>;
}
