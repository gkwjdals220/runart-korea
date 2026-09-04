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

const EXIT_WORDS = /나가기|닫기|뒤로가기|이전 화면|돌아가기/i;
const SIMPLE_BACK = /^(뒤로|이전|←|‹|<|←\s*(MY|홈)?|<\s*(MY|홈)?)$/i;
const TOP_ACTION = /^(MY|홈|메뉴|설정)$/i;

function isDetailPage() {
  const path = window.location.pathname;
  return path !== "/" && !path.startsWith("/login") && !path.startsWith("/join");
}

function ensureUnifiedDetailHeader() {
  const active = isDetailPage();
  document.body.classList.toggle("ttwittunUnifiedDetailHeaderActive", active);
  const existing = document.querySelector<HTMLElement>(".ttwittunUnifiedDetailHeader");
  if (!active) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const header = document.createElement("header");
  header.className = "ttwittunUnifiedDetailHeader";
  header.innerHTML = `
    <button type="button" class="ttwittunUnifiedBack" aria-label="이전 화면으로"><span aria-hidden="true">‹</span></button>
    <div class="ttwittunUnifiedWordmark" aria-label="TTWITTUN RUNNING CREW">
      <strong>TTWITTUN</strong>
      <small>RUNNING CREW</small>
    </div>
    <div class="ttwittunUnifiedHeaderSpacer" aria-hidden="true"></div>
  `;
  header.querySelector<HTMLButtonElement>(".ttwittunUnifiedBack")?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  });
  const anchor = document.getElementById("top");
  if (anchor?.parentElement) anchor.insertAdjacentElement("afterend", header);
  else document.body.prepend(header);
}

function removeLegacyTopControls() {
  if (!isDetailPage()) return;
  document.querySelectorAll<HTMLElement>("button,a,[role='button']").forEach((el) => {
    if (el.closest(".ttwittunUnifiedDetailHeader")) return;
    const label = (el.textContent || "").replace(/\s+/g," ").trim();
    const aria = (el.getAttribute("aria-label") || "").replace(/\s+/g," ").trim();
    const cls = String(el.className || "").toLowerCase();
    const rect = el.getBoundingClientRect();
    const nearTop = rect.top < 190;
    const clearlyLegacy = EXIT_WORDS.test(label) || EXIT_WORDS.test(aria) || SIMPLE_BACK.test(label);
    const headerAction = nearTop && (TOP_ACTION.test(label) || /exit|close|back|headeraction|topaction|topbutton/.test(cls));
    if (clearlyLegacy || headerAction) el.remove();
  });

  document.querySelectorAll<HTMLElement>(".brand,.brandLogo,.topBrand,.pageBrand,.detailBrand").forEach(el=>{
    if (!el.closest(".ttwittunUnifiedDetailHeader")) el.style.display="none";
  });
}

function removeButtonDuckIcons() {
  document.querySelectorAll<HTMLElement>(".ttwittunButtonIcon").forEach(el=>el.remove());
  document.querySelectorAll<HTMLImageElement>("button img, a.btn img, [role='button'] img").forEach(img=>{
    const descriptor = `${img.alt || ""} ${img.title || ""} ${img.className || ""} ${img.src || ""}`.toLowerCase();
    if (/오리|duck|ttwittun|buttonicon|button-icons/.test(descriptor)) img.remove();
  });
}

export default function AppUiFinalPolish(){
  useEffect(()=>{
    const clean=()=>{
      ensureUnifiedDetailHeader();
      removeLegacyTopControls();
      removeButtonDuckIcons();

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
