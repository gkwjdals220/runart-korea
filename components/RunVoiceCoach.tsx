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
  const lastAnnouncedLap=useRef(0);
  const wasOnRunPage=useRef(false);
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const target=(event.target as HTMLElement|null)?.closest("button,a") as HTMLElement|null;
      if(!target||!target.closest(".runModePage"))return;
      const text=(target.textContent||"").replace(/\s+/g," ").trim();
      if(text.includes("러닝 시작")){lastAnnouncedLap.current=0;speak("러닝을 시작합니다. 안전하게 달려볼까요?");}
      else if(text.includes("일시정지"))speak("러닝 기록을 일시정지합니다.");
      else if(text.includes("다시 시작"))speak("러닝 기록을 다시 시작합니다.");
      else if(text.includes("종료")||text.includes("러닝 완료"))speak("러닝을 종료합니다. 오늘도 수고하셨습니다.");
    };
    document.addEventListener("click",onClick,true);

    const inspect=()=>{
      const page=document.querySelector(".runModePage");
      if(!page){
        if(wasOnRunPage.current)lastAnnouncedLap.current=0;
        wasOnRunPage.current=false;
        return;
      }
      wasOnRunPage.current=true;
      const rows=Array.from(page.querySelectorAll(".runSplitRow")) as HTMLElement[];
      if(!rows.length)return;
      const valid=rows.map((row,index)=>{
        const label=(row.querySelector("b")?.textContent||"").trim();
        const pace=(row.querySelector("strong")?.textContent||"").replace("/km","").trim();
        const lapMatch=label.match(/(?:L)?(\d+(?:\.\d+)?)/i);
        const lap=lapMatch?Math.round(Number(lapMatch[1])):index+1;
        const paceMatch=pace.match(/(\d+):(\d+)/);
        const paceSeconds=paceMatch?Number(paceMatch[1])*60+Number(paceMatch[2]):0;
        return {row,label,pace,lap,paceSeconds};
      }).filter(x=>x.lap>0&&x.paceSeconds>=90&&x.paceSeconds<=1800);
      if(!valid.length)return;
      const newest=valid[valid.length-1];
      if(newest.lap<=lastAnnouncedLap.current)return;
      // On page restore, do not read every historical split. Announce only the newest completed boundary.
      lastAnnouncedLap.current=newest.lap;
      speak(`${newest.label||`${newest.lap}번째 랩`} 완료. 페이스 ${paceSpeech(newest.pace)}입니다.`);
    };
    const observer=new MutationObserver(inspect);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    inspect();
    return()=>{document.removeEventListener("click",onClick,true);observer.disconnect();try{window.speechSynthesis?.cancel()}catch{}};
  },[]);
  return null;
}
