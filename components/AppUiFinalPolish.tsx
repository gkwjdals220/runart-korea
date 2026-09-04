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

const EXIT_LABEL = /^(나가기|닫기|뒤로|이전|←\s*(MY|홈)?|<\s*(MY|홈)?)$/i;

function ensureGlobalBackButton() {
  const path = window.location.pathname;
  const shouldShow = path !== "/" && !path.startsWith("/login") && !path.startsWith("/join");
  const existing = document.querySelector<HTMLElement>(".unifiedBackButton[data-global-back='1']");
  if (!shouldShow) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "unifiedBackButton";
  button.dataset.globalBack = "1";
  button.textContent = "<";
  button.setAttribute("aria-label", "이전 화면으로");
  button.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  });
  document.body.appendChild(button);
}

function removeLegacyExitControls() {
  document.querySelectorAll<HTMLElement>("button,a").forEach((el) => {
    if (el.matches(".unifiedBackButton")) return;
    const label = (el.textContent || "").replace(/\s+/g," ").trim();
    const aria = (el.getAttribute("aria-label") || "").trim();
    const isExit = EXIT_LABEL.test(label) || /나가기|뒤로가기|이전 화면|닫기/.test(aria);
    if (!isExit) return;
    el.remove();
  });
}

function removeButtonDuckIcons() {
  document.querySelectorAll<HTMLElement>(".ttwittunButtonIcon").forEach(el=>el.remove());
  document.querySelectorAll<HTMLImageElement>("button img, a.btn img, [role='button'] img").forEach(img=>{
    const descriptor = `${img.alt || ""} ${img.title || ""} ${img.className || ""}`.toLowerCase();
    if (/오리|duck|ttwittun|buttonicon/.test(descriptor)) img.remove();
  });
}

export default function AppUiFinalPolish(){
  useEffect(()=>{
    const clean=()=>{
      removeButtonDuckIcons();
      document.querySelectorAll<HTMLElement>(".brandLogo").forEach(el=>{el.style.display="none";el.setAttribute("aria-hidden","true")});
      removeLegacyExitControls();
      ensureGlobalBackButton();

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
    window.addEventListener("popstate",clean);
    return()=>{observer.disconnect();window.removeEventListener("popstate",clean)};
  },[]);
  return null;
}
