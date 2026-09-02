import Link from "next/link";
import Brand from "@/components/Brand";
import HomePromoCarousel from "@/components/HomePromoCarousel";
import {createClient} from "@/lib/supabase/server";

function raceDday(date:string){const target=new Date(`${date}T00:00:00+09:00`).getTime(),now=new Date();now.setHours(0,0,0,0);const d=Math.ceil((target-now.getTime())/86400000);return d===0?"D-DAY":d>0?`D-${d}`:"종료"}

export default async function Home(){
 const sb=await createClient();
 const [{data:{user}},{count:courseCount}]=await Promise.all([
  sb.auth.getUser(),
  sb.from("runart_courses").select("id",{count:"exact",head:true}).eq("status","approved")
 ]);
 let favoriteCount=0,weekKm=0,nextRace:any=null;
 if(user){
  const weekAgo=new Date(Date.now()-7*86400000).toISOString();
  const today=new Date().toISOString().slice(0,10);
  const [favoriteResult,runsResult,racesResult]=await Promise.all([
   sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id),
   sb.from("runart_live_runs").select("distance_km").eq("user_id",user.id).gte("finished_at",weekAgo),
   sb.from("runart_public_race_participation").select("race_name,race_date,status,distance").eq("user_id",user.id).in("status",["applied","going"]).gte("race_date",today).order("race_date",{ascending:true}).limit(1)
  ]);
  favoriteCount=favoriteResult.count||0;
  weekKm=(runsResult.data||[]).reduce((s:number,r:any)=>s+Number(r.distance_km||0),0);
  nextRace=racesResult.data?.[0]||null;
 }
 const promos=[
  user&&weekKm>0?{href:"/my/history",eyebrow:"YOUR WEEK",title:`이번 주 ${weekKm.toFixed(1)}km`,description:"최근 러닝 흐름을 확인하고 다음 기록을 이어가세요.",cta:"내 기록 보기",icon:"◷",className:"promoRun"}:{href:"/run/free",eyebrow:"START NOW",title:"오늘의 러닝, 바로 시작해요.",description:"GPS 기록을 켜고 달리기만 하면 돼요.",cta:"RUN 시작",icon:"🏃",className:"promoRun"},
  nextRace?{href:"/races/my",eyebrow:`NEXT RACE · ${raceDday(nextRace.race_date)}`,title:nextRace.race_name,description:`${nextRace.race_date}${nextRace.distance?` · ${nextRace.distance}`:""} · 내 참가 일정`,cta:"내 대회 일정",icon:"🏁",className:"promoRace"}:{href:"/races",eyebrow:"RACE",title:"다음 목표를 정해볼까요?",description:"다가오는 전국 러닝 대회와 접수 정보를 확인하세요.",cta:"대회 보기",icon:"🏁",className:"promoRace"},
  {href:"/explore",eyebrow:"COURSE FINDER",title:"어디서 뛸지 고민될 때",description:`${courseCount||0}개 코스를 지도에서 바로 찾아보세요.`,cta:"코스 찾기",icon:"⌖",className:"promoCourse"}
 ].filter(Boolean) as any[];
 return <main className="wrap simpleHome actionHome">
  <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="주요 메뉴"><Link href="/explore">코스 탐색</Link><Link href="/run/free">RUN</Link><Link href="/races">대회</Link><Link href="/dashboard">크루</Link><Link href="/my">MY</Link></nav><div className="nav"><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
  <HomePromoCarousel cards={promos}/>
  <section className="homeActionSection"><div className="homeSectionTitle"><div><small>QUICK START</small><h2>무엇을 할까요?</h2></div></div><div className="homeQuickGrid"><Link href="/explore"><span>⌕</span><b>코스 찾기</b><small>지도 · 검색</small></Link><Link className="primary" href="/run/free"><span>▶</span><b>RUN</b><small>GPS 시작</small></Link><Link href="/my/history"><span>◷</span><b>내 기록</b><small>히스토리</small></Link><Link href="/my/pb"><span>★</span><b>PB</b><small>개인 최고</small></Link><Link href="/dashboard"><span>◎</span><b>크루</b><small>활동 · 기록</small></Link><Link href="/races"><span>⚑</span><b>대회</b><small>실시간 일정</small></Link></div></section>
  <section className="homeActionSection compactHomeSection"><div className="homeSectionTitle"><div><small>FOR YOU</small><h2>자주 찾는 메뉴</h2></div></div><div className="homeDirectList"><Link href="/favorites"><span>♡</span><div><b>저장함</b><small>찜한 코스 {favoriteCount}개 · 장소 · 일정</small></div><em>›</em></Link>{user&&<Link href="/races/my"><span>🏁</span><div><b>내 대회 일정</b><small>{nextRace?`${raceDday(nextRace.race_date)} · ${nextRace.race_name}`:"저장한 참가 일정을 확인"}</small></div><em>›</em></Link>}<Link href="/run/track"><span>🏟</span><div><b>트랙런</b><small>400m 자동랩 · 인터벌</small></div><em>›</em></Link><Link href="/dashboard/activity"><span>◉</span><div><b>크루 최근 활동</b><small>최근 러닝과 참여 현황</small></div><em>›</em></Link></div></section>
  <section className="homeAdSlot" aria-label="프로모션 배너 영역"><div><small>TTWITTUN PARTNER</small><h2>러너에게 필요한 브랜드와 이벤트를<br/>이 공간에서 만날 수 있어요.</h2><p>브랜드 제휴 · 크루 이벤트 · 대회 프로모션 영역</p></div><span>AD</span></section>
 </main>
}
