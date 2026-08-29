"use client";
import {useState} from "react";

export default function SharePlanButton({title}:{title:string}){
 const [msg,setMsg]=useState("");
 async function share(){
  const url=window.location.href;
  if(navigator.share){
   try{await navigator.share({title:`RUNART · ${title}`,text:"러닝 코스와 러닝 후 장소를 함께 저장한 RUN + EAT 일정입니다.",url});return}catch(e:any){if(e?.name==="AbortError")return}
  }
  await navigator.clipboard.writeText(url);setMsg("공유 링크를 복사했습니다.");
 }
 return <div className="actions"><button className="btn" onClick={share}>공유하기</button>{msg&&<span className="muted">{msg}</span>}</div>;
}
