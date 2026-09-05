import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fmt(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function trackPb(rows:any[]){let best400:number|null=null,best800:number|null=null;for(const r of rows){if(r.run_mode!=="track"||!Array.isArray(r.splits))continue;const laps=r.splits.map((s:any)=>({sec:Number(s?.lapSeconds||0),m:Number(s?.distanceM||400)})).filter((s:any)=>s.sec>0&&s.m>=350&&s.m<=450);for(const lap of laps)if(lap.sec>=45&&lap.sec<=600&&(best400==null||lap.sec<best400))best400=lap.sec;for(let i=0;i+1<laps.length;i++){const sec=laps[i].sec+laps[i+1].sec;if(sec>=90&&sec<=1200&&(best800==null||sec<best800))best800=sec}}return{best400,best800}}

export default async function PbPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:rowsData}=await sb.from("runart_live_runs").select("run_mode,pb_1k_sec,pb_3k_sec,pb_5k_sec,pb_10k_sec,splits").eq("user_id",user.id).order("finished_at",{ascending:false}).limit(300);
 const rows=rowsData||[];const pb=(field:string)=>{const v=rows.map((r:any)=>Number(r[field]||0)).filter((x:number)=>x>0);return v.length?Math.min(...v):null};const {best400,best800}=trackPb(rows);
 const cards=[['1K',pb('pb_1k_sec')],['3K',pb('pb_3k_sec')],['5K',pb('pb_5k_sec')],['10K',pb('pb_10k_sec')],['400m',best400],['800m',best800]] as const;
 return <main className="wrap mobileSubPage"><section className="compactPageHero"><span className="eyebrow">PERSONAL BEST</span><h1>내 PB</h1><p className="muted">거리별 최고 기록만 빠르게 확인합니다.</p></section><div className="pbPageGrid">{cards.map(([label,value])=><div className="card pbPageCard" key={label}><small>{label}</small><b>{value?fmt(value):"--:--"}</b><span>{value?"개인 최고":"기록 없음"}</span></div>)}</div><div className="pageBottomActions"><Link className="btn" href="/run/free">기록 시작</Link><Link className="btn ghost" href="/run/track">트랙런</Link></div></main>
}
