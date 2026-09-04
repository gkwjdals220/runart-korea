"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

function isDetailPath(pathname:string){
  return pathname !== "/" && !pathname.startsWith("/login") && !pathname.startsWith("/join");
}

export default function AppUiFinalPolish(){
  const pathname=usePathname();
  const active=isDetailPath(pathname);

  useEffect(()=>{
    document.body.classList.toggle("ttwittunUnifiedDetailHeaderActive",active);
    return()=>document.body.classList.remove("ttwittunUnifiedDetailHeaderActive");
  },[active]);

  if(!active) return null;

  return (
    <header className="ttwittunUnifiedDetailHeader">
      <button
        type="button"
        className="ttwittunUnifiedBack"
        aria-label="이전 화면으로"
        onClick={()=>{
          if(window.history.length>1) window.history.back();
          else window.location.assign("/");
        }}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <div className="ttwittunUnifiedWordmark" aria-label="TTWITTUN RUNNING CREW">
        <strong>TTWITTUN</strong>
        <small>RUNNING CREW</small>
      </div>
      <div className="ttwittunUnifiedHeaderSpacer" aria-hidden="true" />
    </header>
  );
}
