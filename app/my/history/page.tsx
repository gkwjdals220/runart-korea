import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function fmt(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function pace(sec?:number|null){return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`:"--:--"}

export default async function HistoryPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:runs}=await sb.from("runart_live_runs").select("id,run_mode,distance_km,elapsed_seconds,avg_pace_sec_per_km,best_pace_sec_per_km,pb_flags,finished_at,runart_courses(name)").eq("user_id",user.id).order("finished_at",{ascending:false}).limit(100);
 return <main className="wrap mobileSubPage historyPage">
  <header className="compactPageTop historyTop"><Link className="historyBack" href="/my" aria-label="MY로 돌아가기">‹</Link><div><span className="eyebrow">RUN HISTORY</span><h1>러닝 기록</h1></div><Link className="historyRunAction" href="/run/free">RUN</Link></header>
  <section className="compactPageHero historyHero"><p className="muted">최근 기록부터 날짜·거리·시간·평균 페이스를 한눈에 확인합니다.</p></section>
  <div className="runHistoryPage historyList">{(runs||[]).map((r:any)=>{const title=r.run_mode==="watch"?"Apple Watch 러닝":r.run_mode==="treadmill"?"트레드밀":r.run_mode==="track"?"트랙런":r.run_mode==="free"?"자유 러닝":r.runart_courses?.name||"코스 러닝";return <Link className={`historyListCard ${r.run_mode==="treadmill"?"treadmillHistoryCard":""} ${r.run_mode==="watch"?"watchHistoryCard":""}`} href={`/my/runs/${r.id}`} key={r.id}><div className="historyCardMain"><small>{new Date(r.finished_at).toLocaleDateString("ko-KR")}</small><h3>{title}</h3><div className="historyMetrics"><span><b>{Number(r.distance_km||0).toFixed(2)}</b><small>km</small></span><span><b>{fmt(Number(r.elapsed_seconds||0))}</b><small>시간</small></span><span><b>{pace(Number(r.avg_pace_sec_per_km||0))}</b><small>/km</small></span></div></div><span className="historyChevron" aria-hidden="true">›</span></Link>})}
   {!(runs||[]).length&&<div className="card emptyState historyEmpty"><b>아직 러닝 기록이 없어요.</b><p className="muted">첫 러닝을 시작해 기록을 남겨보세요.</p><Link className="btn" href="/run/free">RUN 시작</Link></div>}
  </div>
 </main>
}
