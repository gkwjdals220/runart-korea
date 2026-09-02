"use client";

import {useEffect} from "react";
import {Capacitor} from "@capacitor/core";
import {App} from "@capacitor/app";
import {Browser} from "@capacitor/browser";
import {SplashScreen} from "@capacitor/splash-screen";

const INTERNAL_HOSTS=new Set(["runart-korea.vercel.app"]);

export default function NativeAppBridge(){
 useEffect(()=>{
  if(!Capacitor.isNativePlatform())return;

  document.documentElement.classList.add("nativeApp");
  document.body.classList.add(`native-${Capacitor.getPlatform()}`);
  void SplashScreen.hide().catch(()=>{});

  const appState=App.addListener("appStateChange",({isActive})=>{
   window.dispatchEvent(new CustomEvent("ttwittun:app-state",{detail:{isActive}}));
  });

  const appUrl=App.addListener("appUrlOpen",({url})=>{
   try{
    const next=new URL(url);
    if(INTERNAL_HOSTS.has(next.host)){
     window.location.assign(`${next.pathname}${next.search}${next.hash}`||"/");
    }
   }catch{}
  });

  const back=App.addListener("backButton",({canGoBack})=>{
   const overlayBack=new CustomEvent("ttwittun:native-back",{cancelable:true});
   if(!window.dispatchEvent(overlayBack))return;
   if(canGoBack&&window.location.pathname!=="/")window.history.back();
   else void App.minimizeApp();
  });

  const onClick=(event:MouseEvent)=>{
   const target=event.target as HTMLElement|null;
   const anchor=target?.closest("a[href]") as HTMLAnchorElement|null;
   if(!anchor||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
   const href=anchor.getAttribute("href");
   if(!href||href.startsWith("#")||href.startsWith("mailto:")||href.startsWith("tel:"))return;
   try{
    const url=new URL(anchor.href,window.location.href);
    if(url.protocol!=="http:"&&url.protocol!=="https:")return;
    if(url.host===window.location.host||INTERNAL_HOSTS.has(url.host))return;
    event.preventDefault();
    void Browser.open({url:url.toString(),presentationStyle:"popover"});
   }catch{}
  };

  document.addEventListener("click",onClick,true);
  return ()=>{
   document.removeEventListener("click",onClick,true);
   void appState.then(h=>h.remove());
   void appUrl.then(h=>h.remove());
   void back.then(h=>h.remove());
   document.documentElement.classList.remove("nativeApp");
  };
 },[]);
 return null;
}
