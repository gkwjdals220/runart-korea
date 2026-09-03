"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

type IconName="home"|"search"|"plus"|"crew"|"profile";
function NavIcon({name,active}:{name:IconName;active:boolean}){
 const common={width:25,height:25,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:active?2.35:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
 if(name==="home")return <svg {...common}><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.4v-6.1H9.4V21H4a1 1 0 0 1-1-1z"/></svg>;
 if(name==="search")return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>;
 if(name==="plus")return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="6"/><path d="M12 8v8M8 12h8"/></svg>;
 if(name==="crew")return <svg {...common}><circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 19c.4-3 2.2-4.6 5-4.6S13 16 13.5 19M13.2 15.3c2.9-.6 5.8.8 6.5 3.7"/></svg>;
 return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4.2 3.1-6.5 7.5-6.5s6.9 2.3 7.5 6.5"/></svg>;
}

const items=[
 {href:"/",label:"홈",icon:"home" as IconName,match:(p:string)=>p==="/"||p==="/races"},
 {href:"/explore",label:"코스",icon:"search" as IconName,match:(p:string)=>p.startsWith("/explore")||p.startsWith("/courses")||p.startsWith("/art")||p.startsWith("/favorites")||p.startsWith("/plans")},
 {href:"/run/free",label:"RUN",icon:"plus" as IconName,match:(p:string)=>p.startsWith("/run/")},
 {href:"/dashboard",label:"크루",icon:"crew" as IconName,match:(p:string)=>p.startsWith("/dashboard")||p.startsWith("/manage")||p.startsWith("/races/crew")},
 {href:"/my",label:"MY",icon:"profile" as IconName,match:(p:string)=>p.startsWith("/my")||p.startsWith("/login")||p.startsWith("/join")||p.startsWith("/races/my")}
];

export default function MobileBottomNav(){
 const pathname=usePathname();
 if(pathname.startsWith("/run/"))return null;
 return <nav className="mobileBottomNav mobileBottomNavV3" aria-label="모바일 주요 메뉴">{items.map(item=>{const on=item.match(pathname);return <Link key={item.label} href={item.href} prefetch className={on?"active":""} aria-label={item.label} aria-current={on?"page":undefined}><span className="mobileNavIcon"><NavIcon name={item.icon} active={on}/></span><b>{item.label}</b><i className="mobileNavActiveDot" aria-hidden="true"/></Link>})}</nav>;
}
