"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

type IconName="home"|"search"|"runner"|"crew"|"profile";
function NavIcon({name,active}:{name:IconName;active:boolean}){
 const common={width:25,height:25,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:active?2.35:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
 if(name==="home")return <svg {...common}><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.4v-6.1H9.4V21H4a1 1 0 0 1-1-1z"/></svg>;
 if(name==="search")return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>;
 if(name==="runner")return <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
   <circle cx="28.7" cy="7.2" r="3.2" fill="currentColor"/>
   <path d="M23.7 12.3c1.25-1.1 3.08-1.35 4.6-.63l3.2 1.52 3.8.25c1.08.08 1.88 1.03 1.8 2.1-.08 1.09-1.02 1.9-2.1 1.82l-4.57-.32a3.8 3.8 0 0 1-1.33-.37l-2.03-.96-2.43 3.01 3.15 2.28c.64.46 1.12 1.11 1.39 1.85l2.2 6.18a2.05 2.05 0 0 1-1.24 2.62 2.05 2.05 0 0 1-2.62-1.24l-2-5.62-4.72-3.41a4.1 4.1 0 0 1-.9-.9l-2.74 3.3-5.55 1.58a2.05 2.05 0 0 1-2.53-1.41 2.05 2.05 0 0 1 1.41-2.53l4.38-1.25 6.78-8.02Z" fill="currentColor"/>
   <path d="m20.1 20.5-3.6 7.35-5.66 4.34a2.05 2.05 0 0 0-.38 2.87 2.05 2.05 0 0 0 2.87.38l6.04-4.63c.26-.2.47-.45.62-.75l3.12-6.22" fill="currentColor"/>
   <path d="M5 29.8h5.1M3.7 24.8h4.2M7.2 19.9h4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".55"/>
  </svg>;
 if(name==="crew")return <svg {...common}><circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 19c.4-3 2.2-4.6 5-4.6S13 16 13.5 19M13.2 15.3c2.9-.6 5.8.8 6.5 3.7"/></svg>;
 return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4.2 3.1-6.5 7.5-6.5s6.9 2.3 7.5 6.5"/></svg>;
}

const items=[
 {href:"/",label:"홈",icon:"home" as IconName,match:(p:string)=>p==="/"||p==="/races"},
 {href:"/explore",label:"코스",icon:"search" as IconName,match:(p:string)=>p.startsWith("/explore")||p.startsWith("/courses")||p.startsWith("/art")||p.startsWith("/favorites")||p.startsWith("/plans")},
 {href:"/run/free",label:"RUN",icon:"runner" as IconName,primary:true,match:(p:string)=>p.startsWith("/run/")},
 {href:"/dashboard",label:"크루",icon:"crew" as IconName,match:(p:string)=>p.startsWith("/dashboard")||p.startsWith("/manage")||p.startsWith("/races/crew")},
 {href:"/my",label:"MY",icon:"profile" as IconName,match:(p:string)=>p.startsWith("/my")||p.startsWith("/login")||p.startsWith("/join")||p.startsWith("/races/my")}
];

export default function MobileBottomNav(){
 const pathname=usePathname();
 if(pathname.startsWith("/run/"))return null;
 return <nav className="mobileBottomNav mobileBottomNavV3" aria-label="모바일 주요 메뉴">{items.map(item=>{const on=item.match(pathname);const cls=[on?"active":"",item.primary?"runPrimary":""].filter(Boolean).join(" ");return <Link key={item.label} href={item.href} prefetch className={cls} aria-label={item.label} aria-current={on?"page":undefined}><span className="mobileNavIcon"><NavIcon name={item.icon} active={on}/></span><b>{item.label}</b><i className="mobileNavActiveDot" aria-hidden="true"/></Link>})}</nav>;
}
