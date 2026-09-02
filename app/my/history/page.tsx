import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

function fmt(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function pace(sec?:number|null){return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`:"--:--"}

export default async function HistoryPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:runs}=await sb.from("runart_live_runs").select("id,run_mode,distance_km,elapsed_seconds,avg_pace_sec_per_km,best_pace_sec_per_km,pb_flags,finished_at,runart_courses(name)").eq("user_id",user.id).order("finished_at",{ascending:false}).limit(100);
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/my">← MY</Link><Link className="btn" href="/run/free">RUN</Link></div></header><section className="compactPageHero"><span className="eyebrow">RUN HISTORY</span><h1>러닝 기록</h1><p className="muted">최근 기록부터 한 화면에서 확인합니다.</p></section><div className="mobileCardList runHistoryPage">{(runs||[]).map((r:any)=>{const title=r.run_mode==="track"?"🏟️ 트랙런":r.run_mode==="free"?"자유 러닝":r.runart_courses?.name||"코스 러닝";return <Link className="card mobileListCard historyListCard" href={`/my/runs/${r.id}`} key={r.id}><div><small>{new Date(r.finished_at).toLocaleDateString("ko-KR")}</small><h3>{title}</h3><p><b>{Number(r.distance_km||0).toFixed(2)}km</b> · {fmt(Number(r.elapsed_seconds||0))} · {pace(Number(r.avg_pace_sec_per_km||0))}/km</p></div><b>›</b></Link>})}{!(runs||[]).length&&<div className="card emptyState"><b>아직 러닝 기록이 없어요.</b><p className="muted">첫 러닝을 시작해 기록을 남겨보세요.</p><Link className="btn" href="/run/free">RUN 시작</Link></div>}</div></main>
}
