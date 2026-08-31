import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import Brand from "@/components/Brand";
import RunHistoryMap from "@/components/RunHistoryMap";
import {createClient} from "@/lib/supabase/server";
function fmt(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function pace(sec?:number|null){return sec?`${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`:"--:--"}
export default async function RunHistoryPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:run}=await sb.from("runart_live_runs").select("id,course_id,run_mode,distance_km,elapsed_seconds,avg_pace_sec_per_km,best_pace_sec_per_km,splits,started_at,finished_at,track_geojson,runart_courses(name,start_name)").eq("id",id).eq("user_id",user.id).maybeSingle();if(!run)notFound();
 const splits=Array.isArray(run.splits)?run.splits:[];const isFree=run.run_mode==="free"||!run.course_id;
 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/my">← MY</Link>{!isFree&&run.course_id&&<Link className="btn" href={`/courses/${run.course_id}`}>코스 상세</Link>}<Link className="btn" href="/run/free">🏃 새 러닝</Link></div></header>
 <section className="detailHero card discoveryDetail"><div><span className="eyebrow">TTWITTUN PERSONAL RUN</span><h1>{isFree?"자유 러닝":((run.runart_courses as any)?.name||"코스 러닝")}</h1><p className="muted">{new Date(run.finished_at).toLocaleString("ko-KR")}{!isFree&&(run.runart_courses as any)?.start_name?` · ${(run.runart_courses as any).start_name}`:""}</p></div><div className="score"><b>{Number(run.distance_km).toFixed(2)}</b><span>km</span></div></section>
 <div className="stats section"><div className="stat"><b>{Number(run.distance_km).toFixed(2)}</b><span className="muted">km</span></div><div className="stat"><b>{fmt(Number(run.elapsed_seconds||0))}</b><span className="muted">시간</span></div><div className="stat"><b>{pace(Number(run.avg_pace_sec_per_km||0))}</b><span className="muted">평균 /km</span></div><div className="stat"><b>{pace(Number(run.best_pace_sec_per_km||0))}</b><span className="muted">최고 /km</span></div></div>
 {!!splits.length&&<section className="section"><div className="sectionHead"><div><span className="eyebrow">AUTO LAP</span><h2>1km 스플릿</h2></div></div><div className="card"><div style={{display:"grid",gap:8}}>{splits.map((s:any,i:number)=><div key={`${s.km||i}-${i}`} style={{display:"grid",gridTemplateColumns:"54px 1fr 90px",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(127,127,127,.2)"}}><b>{s.km||i+1}K</b><span>{fmt(Number(s.lapSeconds||0))}</span><strong>{pace(Number(s.paceSecPerKm||0))}/km</strong></div>)}</div></div></section>}
 <section className="section"><div className="sectionHead"><div><span className="eyebrow">MY TRACK</span><h2>내가 달린 GPS 궤적</h2></div></div>{run.track_geojson?.coordinates?.length?<RunHistoryMap track={run.track_geojson}/>:<div className="card muted">저장된 GPS 궤적이 없습니다.</div>}</section>
 </main>
}
