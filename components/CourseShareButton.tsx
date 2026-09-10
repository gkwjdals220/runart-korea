"use client";

import {useState} from "react";

type Props={
  courseId:string;
  courseName:string;
  distanceKm:number;
  region?:string|null;
  city?:string|null;
};

export default function CourseShareButton({courseId,courseName,distanceKm,region,city}:Props){
  const [copied,setCopied]=useState(false);

  async function share(){
    const url=`https://runart-korea.vercel.app/courses/${encodeURIComponent(courseId)}`;
    const place=[region,city].filter(Boolean).join(" ");
    const text=`${courseName} · ${distanceKm.toFixed(1)}km${place?` · ${place}`:""}\n뛰뚠뛰뚠에서 이 러닝 코스를 확인해보세요.`;
    try{
      if(typeof navigator!=="undefined" && navigator.share){
        await navigator.share({title:`${courseName} | 뛰뚠뛰뚠`,text,url});
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1800);
    }catch(error:any){
      if(error?.name==="AbortError")return;
      try{
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        window.setTimeout(()=>setCopied(false),1800);
      }catch{}
    }
  }

  return <button className="btn ghost courseShareButton" type="button" onClick={share} aria-label={`${courseName} 코스 공유`} title="코스 공유">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4M6.5 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/></svg>
    <span>{copied?"링크 복사됨":"공유"}</span>
  </button>;
}
