"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

type IconName="home"|"search"|"runner"|"crew"|"profile";
function NavIcon({name,active}:{name:IconName;active:boolean}){
 const common={width:25,height:25,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:active?2.35:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
 if(name==="home")return <svg {...common}><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.4v-6.1H9.4V21H4a1 1 0 0 1-1-1z"/></svg>;
 if(name==="search")return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>;
 if(name==="runner")return <svg width="40" height="40" viewBox="0 0 40 40" fill="none" color="currentColor" aria-hidden="true">
   <circle cx="27.9" cy="7.3" r="3.4" fill="currentColor"/>
   <path d="M23.1 12.4 19 17.7l4.8 3.6 3.3 5.4" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m23.3 12.5 5.3 2.8 5.2-2.8" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m22.1 21.2-5.1 6.6-6.9 3.1" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m27 26.7-3.8 7.2" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M5.1 15.7h7.2M3.7 21h9.4M6.2 26.3h5.8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity=".48"/>
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
