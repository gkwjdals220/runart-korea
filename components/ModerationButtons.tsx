"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function ModerationButtons({courseId}:{courseId:string}){
 const [msg,setMsg]=useState("");
 async function moderate(status:"approved"|"rejected"){
   if(!confirm(status==="approved"?"이 코스를 승인할까요?":"이 코스를 반려할까요?")) return;
   const sb=createClient();
   const {error}=await sb.rpc("runart_moderate_course",{p_course_id:courseId,p_status:status});
   setMsg(error?error.message:(status==="approved"?"승인 완료":"반려 완료"));
   if(!error)setTimeout(()=>location.reload(),500);
 }
 return <div>
   <div className="actions">
     <button className="btn" onClick={()=>moderate("approved")}>✓ 승인</button>
     <button className="btn danger" onClick={()=>moderate("rejected")}>반려</button>
   </div>
   {msg&&<small className="muted">{msg}</small>}
 </div>
}
