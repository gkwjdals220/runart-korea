"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";

type Card={href:string;eyebrow:string;title:string;description:string;cta:string;icon:string;className?:string};
export default function HomePromoCarousel({cards}:{cards:Card[]}){
 const rail=useRef<HTMLDivElement|null>(null),[active,setActive]=useState(0),touching=useRef(false);
 function go(index:number){const el=rail.current,item=el?.children[index] as HTMLElement|undefined;if(!el||!item)return;el.scrollTo({left:item.offsetLeft-el.offsetLeft,behavior:"smooth"})}
 useEffect(()=>{if(cards.length<2)return;const t=window.setInterval(()=>{if(!touching.current)go((active+1)%cards.length)},5500);return()=>clearInterval(t)},[active,cards.length]);
 function sync(){const el=rail.current;if(!el)return;const children=Array.from(el.children) as HTMLElement[];let best=0,dist=Infinity;children.forEach((c,i)=>{const d=Math.abs((c.offsetLeft-el.offsetLeft)-el.scrollLeft);if(d<dist){dist=d;best=i}});setActive(best)}
 return <section className="homePromoCarousel" aria-label="주요 소식과 바로가기"><div ref={rail} className="homePromoRail" onScroll={sync} onPointerDown={()=>touching.current=true} onPointerUp={()=>touching.current=false} onPointerCancel={()=>touching.current=false}>{cards.map((c,i)=><Link className={`homePromoCard ${c.className||""}`} href={c.href} key={`${c.href}-${i}`}><div><small>{c.eyebrow}</small><h2>{c.title}</h2><p>{c.description}</p><b>{c.cta} →</b></div><span>{c.icon}</span></Link>)}</div><div className="homePromoDots" aria-label="배너 위치">{cards.map((_,i)=><button type="button" key={i} aria-label={`${i+1}번째 배너`} className={active===i?"on":""} onClick={()=>go(i)}/>)}</div></section>
}
