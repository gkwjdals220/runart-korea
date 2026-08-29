"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

const items=[
 {href:"/",label:"홈",icon:"⌂",match:(p:string)=>p==="/"},
 {href:"/#explore",label:"탐색",icon:"⌕",match:(p:string)=>p.startsWith("/courses")||p.startsWith("/art")},
 {href:"/favorites",label:"찜",icon:"♡",match:(p:string)=>p.startsWith("/favorites")||p.startsWith("/plans")},
 {href:"/dashboard",label:"크루",icon:"◉",match:(p:string)=>p.startsWith("/dashboard")||p.startsWith("/manage")||p.startsWith("/races")},
 {href:"/my",label:"MY",icon:"●",match:(p:string)=>p.startsWith("/my")||p.startsWith("/login")||p.startsWith("/join")}
];

export default function MobileBottomNav(){
 const pathname=usePathname();
 return <nav className="mobileBottomNav" aria-label="모바일 주요 메뉴">
  {items.map(item=>{
   const on=item.match(pathname);
   return <Link key={item.label} href={item.href} className={on?"active":""} aria-current={on?"page":undefined}>
    <span className="mobileNavIcon">{item.icon}</span><b>{item.label}</b>
   </Link>;
  })}
 </nav>;
}
