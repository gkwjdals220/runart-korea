import {NextResponse} from "next/server";
import {createHash} from "crypto";

const SOURCE_URL="https://rung.kr/";
const REGIONS=["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주"];

function decode(s:string){return s.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">")}
function textOf(html:string){return decode(html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim())}
function isoDate(raw:string){const m=raw.match(/(20\d{2})\s*(?:년|[.\/-])\s*(\d{1,2})\s*(?:월|[.\/-])\s*(\d{1,2})\s*일?/);if(!m)return null;return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`}
function allDates(raw:string){const re=/(20\d{2})\s*(?:년|[.\/-])\s*(\d{1,2})\s*(?:월|[.\/-])\s*(\d{1,2})\s*일?/g,out:string[]=[];let m:RegExpExecArray|null;while((m=re.exec(raw)))out.push(`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`);return out}
function distances(t:string){const out:string[]=[];if(/풀|full/i.test(t))out.push("Full");if(/하프|half/i.test(t))out.push("Half");if(/\b10\s*k|10\s*km/i.test(t))out.push("10K");if(/\b5\s*k|5\s*km/i.test(t))out.push("5K");if(/울트라|ultra/i.test(t))out.push("Ultra");return Array.from(new Set(out))}
function deadlineOf(t:string,eventDate:string){const idx=t.search(/접수|신청/);if(idx<0)return null;const dates=allDates(t.slice(idx));if(!dates.length)return null;const candidates=dates.filter(x=>x!==eventDate);return candidates[candidates.length-1]||dates[dates.length-1]||null}
function statusOf(t:string,deadline:string|null){if(!/접수|신청/.test(t))return "unknown";if(/접수\s*마감|신청\s*마감|마감됨|접수종료/.test(t))return "closed";if(/접수\s*예정|신청\s*예정/.test(t))return "upcoming";if(!deadline)return /접수중|신청중/.test(t)?"open":"unknown";const today=new Date();today.setHours(0,0,0,0);return new Date(`${deadline}T23:59:59+09:00`).getTime()>=today.getTime()?"open":"closed"}
function cleanName(t:string,date:string){const forms=[date,date.replace(/-/g,"."),date.replace(/-/g,"/"),date.replace(/(\d{4})-(\d{2})-(\d{2})/,(_,y,m,d)=>`${y}년 ${Number(m)}월 ${Number(d)}일`)];let cut=t.length;for(const f of forms){const i=t.indexOf(f);if(i>=0)cut=Math.min(cut,i)}let name=t.slice(0,cut);name=name.replace(/D[-+]?\d+/gi," ").replace(/오늘/g," ").replace(/공식 사이트\s*→?/g," ").replace(/\s+/g," ").trim();return name}

export async function GET(){
 try{
  const r=await fetch(SOURCE_URL,{headers:{"user-agent":"TTWITTUN-RaceIndex/1.0 (+https://runart-korea.vercel.app)"},next:{revalidate:1800}});
  if(!r.ok)throw new Error(`source ${r.status}`);
  const html=await r.text(),rows:any[]=[];
  const re=/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;let m:RegExpExecArray|null;
  while((m=re.exec(html))){
   const txt=textOf(m[4]);const date=isoDate(txt);if(!date)continue;
   const name=cleanName(txt,date);if(name.length<4)continue;
   const eventTime=new Date(`${date}T23:59:59+09:00`).getTime();if(eventTime<Date.now()-86400000)continue;
   const region=REGIONS.find(x=>new RegExp(`(^|\\s)${x}(\\s|$)`).test(txt))||null;
   const official=m[2].startsWith("http")?m[2]:new URL(m[2],SOURCE_URL).toString();
   const deadline=deadlineOf(txt,date),dists=distances(txt),key=createHash("sha1").update(`${name}|${date}|${official}`).digest("hex").slice(0,20);
   rows.push({source_key:`rung:${key}`,name,race_date:date,region,distance_options:dists,registration_deadline:deadline,registration_status:statusOf(txt,deadline),official_url:official,registration_text:(txt.match(/(?:접수|신청)[\s\S]*$/)?.[0]||"").slice(0,180),source_name:"rung",source_url:SOURCE_URL});
  }
  const unique=new Map<string,any>();for(const x of rows){const k=`${x.name.replace(/\s/g,"").toLowerCase()}|${x.race_date}`;if(!unique.has(k))unique.set(k,x)}
  const races=Array.from(unique.values()).sort((a:any,b:any)=>a.race_date.localeCompare(b.race_date)).slice(0,180);
  return NextResponse.json({races,source:{name:"rung",url:SOURCE_URL,fetched_at:new Date().toISOString()},count:races.length});
 }catch(e:any){return NextResponse.json({races:[],error:e?.message||"race source unavailable",source:{name:"rung",url:SOURCE_URL}},{status:502})}
}
