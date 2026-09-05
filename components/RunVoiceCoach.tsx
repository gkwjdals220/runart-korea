"use client";

import {useEffect,useRef} from "react";

function speak(text:string){
  if(typeof window==="undefined"||!("speechSynthesis" in window))return;
  try{
    window.speechSynthesis.cancel();
    const utter=new SpeechSynthesisUtterance(text);
    utter.lang="ko-KR";
    utter.rate=1.02;
    utter.pitch=1;
    utter.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const ko=voices.find(v=>v.lang?.toLowerCase().startsWith("ko"));
    if(ko)utter.voice=ko;
    window.speechSynthesis.speak(utter);
  }catch{}
}

function paceSpeech(text:string){
  const match=text.match(/(\d+):(\d+)/);
  if(!match)return text;
  const m=Number(match[1]),s=Number(match[2]);
  return `${m}분 ${s?`${s}초`:""}`.trim();
}

export default function RunVoiceCoach(){
  const lastSplitCount=useRef(0);
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const target=(event.target as HTMLElement|null)?.closest("button,a") as HTMLElement|null;
      if(!target||!target.closest(".runModePage"))return;
      const text=(target.textContent||"").replace(/\s+/g," ").trim();
      if(text.includes("러닝 시작"))speak("러닝을 시작합니다. 안전하게 달려볼까요?");
      else if(text.includes("일시정지"))speak("러닝 기록을 일시정지합니다.");
      else if(text.includes("다시 시작"))speak("러닝 기록을 다시 시작합니다.");
      else if(text.includes("종료")||text.includes("러닝 완료"))speak("러닝을 종료합니다. 오늘도 수고하셨습니다.");
    };
    document.addEventListener("click",onClick,true);

    const observer=new MutationObserver(()=>{
      const rows=document.querySelectorAll(".runModePage .runSplitRow");
      if(!rows.length){lastSplitCount.current=0;return;}
      if(rows.length<=lastSplitCount.current)return;
      lastSplitCount.current=rows.length;
      const row=rows[rows.length-1] as HTMLElement;
      const pieces=(row.textContent||"").replace(/\s+/g," ").trim().split(" ");
      const label=pieces[0]||`${rows.length}번째 랩`;
      const pace=(row.querySelector("strong")?.textContent||"").replace("/km","");
      speak(`${label} 완료. 페이스 ${paceSpeech(pace)}입니다.`);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    return()=>{document.removeEventListener("click",onClick,true);observer.disconnect();try{window.speechSynthesis?.cancel()}catch{}};
  },[]);
  return null;
}
