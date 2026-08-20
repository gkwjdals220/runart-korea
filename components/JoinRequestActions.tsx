"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function JoinRequestActions({requestId}:{requestId:string}){
  const [msg,setMsg]=useState("");
  async function act(action:"approved"|"rejected"){
    const sb=createClient();
    const {error}=await sb.rpc("runart_handle_join_request",{p_request_id:requestId,p_action:action});
    if(error)return setMsg(error.message);
    setMsg(action==="approved"?"승인 완료":"거절 완료");
    setTimeout(()=>location.reload(),400);
  }
  return <div><div className="actions"><button className="btn" onClick={()=>act("approved")}>승인</button><button className="btn danger" onClick={()=>act("rejected")}>거절</button></div>{msg&&<small className="muted">{msg}</small>}</div>;
}
