"use client";
import {useState} from "react";
import {Capacitor} from "@capacitor/core";
import {Share} from "@capacitor/share";

export default function SharePlanButton({title}:{title:string}){
 const [msg,setMsg]=useState("");
 async function share(){
  const url=window.location.href;
  const shareTitle=`TTWITTUN · ${title}`;
  const text="러닝 코스와 러닝 후 장소를 함께 저장한 RUN + EAT 일정입니다.";
  if(Capacitor.isNativePlatform()){
   try{await Share.share({title:shareTitle,text,url,dialogTitle:"TTWITTUN 일정 공유"});return}catch(e:any){if(e?.message?.toLowerCase?.().includes("cancel"))return}
  }
  if(navigator.share){
   try{await navigator.share({title:shareTitle,text,url});return}catch(e:any){if(e?.name==="AbortError")return}
  }
  try{await navigator.clipboard.writeText(url);setMsg("공유 링크를 복사했습니다.")}catch{setMsg("주소창의 링크를 복사해주세요.")}
 }
 return <div className="actions"><button className="btn" type="button" onClick={share}>공유하기</button>{msg&&<span className="muted" role="status" aria-live="polite">{msg}</span>}</div>;
}
