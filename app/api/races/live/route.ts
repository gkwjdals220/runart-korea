import {NextResponse} from "next/server";
import {createHash} from "crypto";

const SOURCE_URL="https://rung.kr/";
const REGIONS=["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주"];

function decode(s:string){return s.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">")}
function textOf(html:string){return decode(html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim())}
function isoDate(raw:string){const dot=raw.match(/(20\d{2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{1,2})/),kor=raw.match(/(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/),m=dot||kor;if(!m)return null;return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`}
function allDates(raw:string){const found:string[]=[],re=/(20\d{2}\s*(?:[.\/-]\s*\d{1,2}\s*[.\/-]\s*\d{1,2}|년\s*\d{1,2}\s*월\s*\d{1,2}\s*일))/g;let m:RegExpExecArray|null;while((m=re.exec(raw))){const d=isoDate(m[1]);if(d)found.push(d)}return found}
function distances(t:string){const out:string[]=[];if(/풀|full/i.test(t))out.push("Full");if(/하프|half/i.test(t))out.push("Half");if(/\b10\s*k|10km/i.test(t))out.push("10K");if(/\b5\s*k|5km/i.test(t))out.push("5K");if(/울트라|ultra/i.test(t))out.push("Ultra");return Array.from(new Set(out))}
function registrationWindow(t:string,eventDate:string){const idx=t.indexOf("접수");if(idx<0)return {start:null,deadline:null};const dates=allDates(t.slice(idx)).filter(d=>d!==eventDate);if(dates.length>=2)return {start:dates[0],deadline:dates[1]};if(dates.length===1)return {start:null,deadline:dates[0]};return {start:null,deadline:null}}
function statusOf(t:string,start:string|null,deadline:string|null){const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();if(/접수\s*마감|접수완료/.test(t))return "closed";if(start&&new Date(`${start}T00:00:00+09:00`).getTime()>today)return "upcoming";if(deadline&&new Date(`${deadline}T23:59:59+09:00`).getTime()<today)return "closed";if(/접수/.test(t)&&deadline)return "open";return "unknown"}
function cleanName(t:string,date:string){let name=t.split(date.replace(/-/g,"."))[0]||t;name=name.replace(/D[-+]?\d+/gi," ").replace(/오늘|NEW/g," ").replace(/공식 사이트\s*→?/g," ").replace(/\s+/g," ").trim();return name}
function canonicalName(name:string){return name.toLowerCase().replace(/20\d{2}/g,"").replace(/제\s*\d+\s*회/g,"").replace(/\d+\s*회/g,"").replace(/[\[\](){}<>·ㆍ:：,._\-–—/\\|!?~'"“”‘’]/g,"").replace(/\s+/g,"").replace(/마라톤대회/g,"마라톤").replace(/러닝대회/g,"런")}
function richness(x:any){return (x.distance_options?.length||0)*3+(x.registration_start?2:0)+(x.registration_deadline?2:0)+(x.registration_text?.length||0)/100+(x.official_url?1:0)}

export async function GET(){
 try{
  const r=await fetch(SOURCE_URL,{headers:{"user-agent":"TTWITTUN-RaceIndex/1.2 (+https://runart-korea.vercel.app)"},next:{revalidate:1800}});if(!r.ok)throw new Error(`source ${r.status}`);
  const html=await r.text(),rows:any[]=[],re=/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;let m:RegExpExecArray|null;
  while((m=re.exec(html))){const txt=textOf(m[4]),eventDates=allDates(txt),date=eventDates[0]||null;if(!date)continue;const name=cleanName(txt,date);if(name.length<4||/^전체$/.test(name))continue;const eventTime=new Date(`${date}T23:59:59+09:00`).getTime();if(eventTime<Date.now()-86400000)continue;const region=REGIONS.find(x=>new RegExp(`(^|\\s)${x}(\\s|$)`).test(txt))||null,official=m[2].startsWith("http")?m[2]:new URL(m[2],SOURCE_URL).toString(),window=registrationWindow(txt,date),dists=distances(txt),canon=canonicalName(name),key=createHash("sha1").update(`${canon}|${date}`).digest("hex").slice(0,20);rows.push({source_key:`rung:${key}`,name,race_date:date,region,distance_options:dists,registration_start:window.start,registration_deadline:window.deadline,registration_status:statusOf(txt,window.start,window.deadline),official_url:official,registration_text:(txt.includes("접수")?txt.slice(txt.indexOf("접수")):"").slice(0,180),source_name:"rung",source_url:SOURCE_URL,canonical_name:canon})}
  const unique=new Map<string,any>();for(const x of rows){const k=`${x.canonical_name}|${x.race_date}`;const old=unique.get(k);if(!old||richness(x)>richness(old))unique.set(k,x)}
  const races=Array.from(unique.values()).map(({canonical_name,...x}:any)=>x).sort((a:any,b:any)=>a.race_date.localeCompare(b.race_date)).slice(0,180);
  return NextResponse.json({races,source:{name:"rung",url:SOURCE_URL,fetched_at:new Date().toISOString()},count:races.length});
 }catch(e:any){return NextResponse.json({races:[],error:e?.message||"race source unavailable",source:{name:"rung",url:SOURCE_URL}},{status:502})}
}
