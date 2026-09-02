"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

const items=[
 {href:"/",label:"홈",icon:"⌂",match:(p:string)=>p==="/"},
 {href:"/#explore",label:"코스",icon:"⌕",match:(p:string)=>p.startsWith("/courses")||p.startsWith("/art")||p.startsWith("/favorites")||p.startsWith("/plans")},
 {href:"/run/free",label:"RUN",icon:"▶",primary:true,match:(p:string)=>p.startsWith("/run/")},
 {href:"/dashboard",label:"크루",icon:"◉",match:(p:string)=>p.startsWith("/dashboard")||p.startsWith("/manage")||p.startsWith("/races")},
 {href:"/my",label:"MY",icon:"●",match:(p:string)=>p.startsWith("/my")||p.startsWith("/login")||p.startsWith("/join")}
];

export default function MobileBottomNav(){
 const pathname=usePathname();
 if(pathname.startsWith("/run/")) return null;
 return <nav className="mobileBottomNav mobileBottomNavV2" aria-label="모바일 주요 메뉴">
  {items.map(item=>{
   const on=item.match(pathname);
   return <Link key={item.label} href={item.href} className={`${on?"active":""} ${item.primary?"primary":""}`} aria-current={on?"page":undefined}>
    <span className="mobileNavIcon">{item.icon}</span><b>{item.label}</b>
   </Link>;
  })}
 </nav>;
}
