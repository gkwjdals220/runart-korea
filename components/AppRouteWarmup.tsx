"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

const ROUTES=["/","/races","/explore","/run/free","/dashboard","/my"];
export default function AppRouteWarmup(){
 const router=useRouter();
 useEffect(()=>{
  const warm=()=>ROUTES.forEach(route=>router.prefetch(route));
  const w=window as any;
  const id=w.requestIdleCallback?w.requestIdleCallback(warm,{timeout:1600}):window.setTimeout(warm,700);
  return()=>{if(w.cancelIdleCallback)w.cancelIdleCallback(id);else clearTimeout(id)};
 },[router]);
 return null;
}
