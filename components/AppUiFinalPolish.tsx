"use client";

import {useEffect} from "react";

function shareRace(card: HTMLElement) {
  const title = card.querySelector("h3")?.textContent?.trim() || "TTWITTUN 대회 일정";
  const detail = card.querySelector(".raceLiveTitle p")?.textContent?.trim() || "";
  const link = (card.querySelector("a.raceGoogleForm") as HTMLAnchorElement | null)?.href
    || (Array.from(card.querySelectorAll("a")).find(a => (a as HTMLAnchorElement).target === "_blank") as HTMLAnchorElement | undefined)?.href
    || window.location.href;
  const text = detail ? `${title} · ${detail}` : title;
  if (navigator.share) {
    navigator.share({title:`TTWITTUN · ${title}`,text,url:link}).catch(()=>{});
    return;
  }
  navigator.clipboard?.writeText(link).then(()=>alert("대회 링크를 복사했어요.")).catch(()=>{});
}

export default function AppUiFinalPolish(){
  useEffect(()=>{
    const clean=()=>{
      document.querySelectorAll<HTMLElement>("button .ttwittunButtonIcon, a.btn .ttwittunButtonIcon, .raceCardActions .ttwittunButtonIcon, .compactActions .ttwittunButtonIcon").forEach(el=>el.remove());

      document.querySelectorAll<HTMLElement>(".brandLogo").forEach(el=>{el.style.display="none";el.setAttribute("aria-hidden","true")});

      document.querySelectorAll<HTMLElement>("button,a").forEach(el=>{
        if((el.textContent||"").trim()!=="나가기" || el.dataset.backConverted==="1") return;
        el.dataset.backConverted="1";
        el.textContent="‹";
        el.classList.add("unifiedBackButton");
        el.setAttribute("aria-label","이전 화면으로");
        if(el instanceof HTMLAnchorElement) el.removeAttribute("href");
        el.addEventListener("click",e=>{e.preventDefault();window.history.length>1?window.history.back():window.location.assign("/")});
      });

      document.querySelectorAll<HTMLElement>(".raceLiveCard").forEach(card=>{
        const actions=card.querySelector<HTMLElement>(".raceCardActions");
        if(!actions || actions.querySelector(".raceShareButton")) return;
        const btn=document.createElement("button");
        btn.type="button";
        btn.className="raceShareButton";
        btn.textContent="공유하기";
        btn.addEventListener("click",()=>shareRace(card));
        actions.appendChild(btn);
      });

      document.querySelectorAll<HTMLSelectElement>(".startFlowCompact select").forEach(select=>{
        if(select.dataset.defaultCleared==="1") return;
        select.dataset.defaultCleared="1";
        if(!Array.from(select.options).some(o=>o.value==="")){
          const placeholder=document.createElement("option");
          placeholder.value="";
          placeholder.textContent="선택해주세요";
          placeholder.disabled=true;
          select.insertBefore(placeholder,select.firstChild);
        }
        select.value="";
        select.dispatchEvent(new Event("change",{bubbles:true}));
      });

      document.querySelectorAll<HTMLElement>(".startFlowCompact [aria-pressed='true']").forEach(el=>{
        if(el.dataset.defaultCleared==="1") return;
        el.dataset.defaultCleared="1";
        el.setAttribute("aria-pressed","false");
        el.classList.remove("on","active","selected");
      });
    };
    clean();
    const observer=new MutationObserver(clean);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
