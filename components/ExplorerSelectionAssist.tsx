"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function ExplorerSelectionAssist(){
 const pathname=usePathname();
 useEffect(()=>{
  if(!pathname.startsWith("/explore"))return;
  let previous:Element|null=null;
  const sync=()=>{
   if(!window.matchMedia("(max-width:700px)").matches)return;
   const selected=document.querySelector(".explorerCourseList .explorerCourseCard.selected");
   if(!selected||selected===previous)return;
   previous=selected;
   const list=selected.closest(".explorerCourseList") as HTMLElement|null;
   if(!list)return;
   const top=(selected as HTMLElement).offsetTop-list.offsetTop-46;
   list.scrollTo({top:Math.max(0,top),behavior:"smooth"});
  };
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"],childList:true});
  sync();
  return()=>observer.disconnect();
 },[pathname]);
 return null;
}
