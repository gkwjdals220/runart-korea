import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";
function fmt(sec:number){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function pace(sec?:number|null){return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`:"--:--"}
export default async function MyPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();
 if(!user)return <main className="wrap"><header className="top"><Brand/></header><section className="hero compact"><div><span className="eyebrow">MY RUNART</span><h1>MY</h1><p className="muted">로그인하면 찜한 코스, RUN + EAT 일정, 크루 기록을 한 곳에서 관리할 수 있습니다.</p><div className="actions" style={{marginTop:18}}><Link className="btn" href="/login">로그인</Link><Link className="btn ghost" href="/join">회원가입</Link></div></div></section></main>;
 const {data:profile}=await sb.from("runart_profiles").select("display_name").eq("user_id",user.id).maybeSingle();
 const {count:favCount}=await sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id);const {count:planCount}=await sb.from("runart_run_eat_plans").select("id",{count:"exact",head:true}).eq("user_id",user.id);
 const {data:allRuns}=await sb.from("runart_live_runs").select("id,course_id,distance_km,elapsed_seconds,avg_pace_sec_per_km,finished_at,runart_courses(name)").eq("user_id",user.id).order("finished_at",{ascending:false}).limit(200);
 const runs=(allRuns||[]).slice(0,8);
 const totalKm=(allRuns||[]).reduce((sum:number,r:any)=>sum+Number(r.distance_km||0),0);
 const longestKm=(allRuns||[]).reduce((max:number,r:any)=>Math.max(max,Number(r.distance_km||0)),0);
 const validPaces=(allRuns||[]).map((r:any)=>Number(r.avg_pace_sec_per_km||0)).filter((v:number)=>v>0);
 const avgPace=validPaces.length?Math.round(validPaces.reduce((a:number,b:number)=>a+b,0)/validPaces.length):null;
 return <main className="wrap myPage"><header className="top myTop"><Brand/><div className="nav"><Link className="btn ghost" href="/#explore">코스 찾기</Link><Link className="btn ghost" href="/favorites">♡ 찜</Link><Link className="btn" href="/dashboard">크루</Link></div></header>
  <section className="myHero"><div><span className="eyebrow">MY RUNART</span><h1>{profile?.display_name||"러너"}님</h1><p>내 러닝과 저장한 장소, 크루 활동을 빠르게 확인하세요.</p></div><Link className="btn" href="/#explore">새 코스 찾기</Link></section>
  <nav className="mySectionNav" aria-label="MY 빠른 이동"><a href="#my-summary">요약</a><a href="#recent-runs">최근 러닝</a><Link href="/favorites">찜</Link><Link href="/dashboard">크루 기록</Link><Link href="/races">대회 일정</Link></nav>
  <section className="mySummaryGrid" id="my-summary"><div><small>라이브 러닝</small><b>{allRuns?.length||0}<em>회</em></b></div><div><small>누적 거리</small><b>{totalKm.toFixed(1)}<em>km</em></b></div><div><small>최장 거리</small><b>{longestKm.toFixed(1)}<em>km</em></b></div><div><small>평균 페이스</small><b>{pace(avgPace)}<em>/km</em></b></div></section>
  <section className="myQuickGrid"><Link className="card myQuickCard" href="/favorites"><span>♡</span><div><b>내 찜 {favCount||0}</b><small>코스·맛집·RUN + EAT</small></div><em>→</em></Link><Link className="card myQuickCard" href="/dashboard"><span>◉</span><div><b>크루 기록</b><small>출석·활동·러닝 로그</small></div><em>→</em></Link><Link className="card myQuickCard" href="/races"><span>🏁</span><div><b>대회 일정</b><small>참가 현황과 신청 관리</small></div><em>→</em></Link><Link className="card myQuickCard" href="/favorites"><span>🍴</span><div><b>RUN + EAT {planCount||0}</b><small>저장한 러닝 후 일정</small></div><em>→</em></Link></section>
  <section className="section" id="recent-runs"><div className="sectionHead"><div><span className="eyebrow">GPS RUN HISTORY</span><h2>최근 라이브 러닝</h2><p className="muted">기록을 누르면 실제 GPS 궤적을 지도에서 확인할 수 있습니다.</p></div><a className="textLink" href="#top">맨 위로 ↑</a></div><div className="myRunList">{runs.map((r:any)=><Link className="myRunItem" key={r.id} href={`/my/runs/${r.id}`}><div className="myRunDate"><b>{new Date(r.finished_at).toLocaleDateString("ko-KR",{month:"short",day:"numeric"})}</b><small>{new Date(r.finished_at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</small></div><div className="myRunMain"><h3>{r.runart_courses?.name||"러닝 기록"}</h3><p><b>{Number(r.distance_km).toFixed(2)}km</b><span>{fmt(Number(r.elapsed_seconds||0))}</span><span>{pace(Number(r.avg_pace_sec_per_km||0))}/km</span></p></div><em>›</em></Link>)}{!runs.length&&<div className="card emptyState"><b>아직 라이브 러닝 기록이 없어요.</b><p className="muted">코스를 선택하고 라이브 러닝 모드로 첫 기록을 남겨보세요.</p><Link className="btn" href="/#explore">코스 찾기</Link></div>}</div></section>
 </main>;
}
