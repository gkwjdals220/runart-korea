import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

function pace(sec?:number|null){return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`:"--:--"}

export default async function MyPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();
 if(!user)return <main className="wrap authJoinPage"><header className="top"><Brand/></header><section className="hero compact"><div><span className="eyebrow">MY TTWITTUN</span><h1>MY</h1><p className="muted">로그인하면 러닝 기록과 저장한 코스를 관리할 수 있어요.</p><div className="actions" style={{marginTop:18}}><Link className="btn" href="/login">로그인</Link></div></div></section></main>;
 const {data:profile}=await sb.from("runart_profiles").select("display_name").eq("user_id",user.id).maybeSingle();
 const {count:favCount}=await sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id);
 const {data:rowsData}=await sb.from("runart_live_runs").select("distance_km,avg_pace_sec_per_km,finished_at").eq("user_id",user.id).order("finished_at",{ascending:false}).limit(300);
 const rows=rowsData||[],now=Date.now(),weekAgo=now-7*86400000,monthAgo=now-30*86400000;
 const week=rows.filter((r:any)=>new Date(r.finished_at).getTime()>=weekAgo),month=rows.filter((r:any)=>new Date(r.finished_at).getTime()>=monthAgo);
 const weekKm=week.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0),monthKm=month.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0),totalKm=rows.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0);
 const paces=rows.map((r:any)=>Number(r.avg_pace_sec_per_km||0)).filter((v:number)=>v>0),avgPace=paces.length?Math.round(paces.reduce((a:number,b:number)=>a+b,0)/paces.length):null;
 return <main className="wrap hubPage myHubPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/my/profile">프로필</Link><Link className="btn" href="/run/free">RUN</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">MY TTWITTUN</span><h1>{profile?.display_name||"러너"}님</h1><p className="muted">내 기록과 저장함을 필요한 화면으로 바로 이동해 확인하세요.</p></section>
  <section className="myHubSummary"><div><small>이번 주</small><b>{weekKm.toFixed(1)}<em>km · {week.length}회</em></b></div><div><small>최근 30일</small><b>{monthKm.toFixed(1)}<em>km · {month.length}회</em></b></div><div><small>누적</small><b>{totalKm.toFixed(1)}<em>km</em></b></div><div><small>평균 페이스</small><b>{pace(avgPace)}<em>/km</em></b></div></section>
  <section className="pageHubGrid">
   <Link className="hubTile" href="/my/history"><span>👟</span><div><small>HISTORY</small><h2>러닝 기록</h2><p>최근 러닝과 상세 기록</p></div><b>›</b></Link>
   <Link className="hubTile" href="/my/pb"><span>🏆</span><div><small>PERSONAL BEST</small><h2>내 PB</h2><p>1K·3K·5K·10K·트랙</p></div><b>›</b></Link>
   <Link className="hubTile" href="/favorites"><span>♡</span><div><small>SAVED</small><h2>저장함</h2><p>찜한 코스 {favCount||0}개 · 장소 · 일정</p></div><b>›</b></Link>
   <Link className="hubTile" href="/dashboard"><span>◉</span><div><small>CREW</small><h2>크루</h2><p>활동·출석·대회 관리</p></div><b>›</b></Link>
   <Link className="hubTile" href="/races"><span>🏁</span><div><small>RACE</small><h2>대회 일정</h2><p>참가 현황과 신청</p></div><b>›</b></Link>
   <Link className="hubTile" href="/my/profile"><span>⚙</span><div><small>PROFILE</small><h2>프로필</h2><p>표시 이름과 계정 관리</p></div><b>›</b></Link>
   <Link className="hubTile primaryHubTile" href="/run/free"><span>▶</span><div><small>START</small><h2>RUN 시작</h2><p>바로 GPS 기록 시작</p></div><b>›</b></Link>
  </section>
 </main>;
}
