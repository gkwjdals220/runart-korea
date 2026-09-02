import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {count:courseCount}=await sb.from("runart_courses").select("id",{count:"exact",head:true}).eq("status","approved");
 let favoriteCount=0;
 if(user){const {count}=await sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id);favoriteCount=count||0}
 return <main className="wrap simpleHome actionHome">
  <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="주요 메뉴"><Link href="/explore">코스 탐색</Link><Link href="/run/free">RUN</Link><Link href="/races">대회</Link><Link href="/dashboard">크루</Link><Link href="/my">MY</Link></nav><div className="nav"><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>

  <section className="homePromoRail" aria-label="주요 소식과 바로가기">
   <Link className="homePromoCard promoRun" href="/run/free"><div><small>START NOW</small><h1>오늘의 러닝,<br/>바로 시작해요.</h1><p>GPS 기록을 켜고 달리기만 하면 돼요.</p><b>RUN 시작 →</b></div><span>🏃</span></Link>
   <Link className="homePromoCard promoCourse" href="/explore"><div><small>COURSE FINDER</small><h2>어디서 뛸지<br/>고민될 때</h2><p>{courseCount||0}개 코스를 지도에서 바로 찾아보세요.</p><b>코스 찾기 →</b></div><span>⌖</span></Link>
   <Link className="homePromoCard promoRace" href="/races"><div><small>RACE</small><h2>다음 목표를<br/>정해볼까요?</h2><p>대회 일정과 참가 현황을 한 곳에서.</p><b>대회 보기 →</b></div><span>🏁</span></Link>
  </section>

  <section className="homeActionSection">
   <div className="homeSectionTitle"><div><small>QUICK START</small><h2>무엇을 할까요?</h2></div></div>
   <div className="homeQuickGrid">
    <Link href="/explore"><span>⌕</span><b>코스 찾기</b><small>지도 · 검색</small></Link>
    <Link className="primary" href="/run/free"><span>▶</span><b>RUN</b><small>GPS 시작</small></Link>
    <Link href="/my/history"><span>◷</span><b>내 기록</b><small>히스토리</small></Link>
    <Link href="/my/pb"><span>★</span><b>PB</b><small>개인 최고</small></Link>
    <Link href="/dashboard"><span>◎</span><b>크루</b><small>활동 · 기록</small></Link>
    <Link href="/races"><span>⚑</span><b>대회</b><small>일정 · 참가</small></Link>
   </div>
  </section>

  <section className="homeActionSection compactHomeSection">
   <div className="homeSectionTitle"><div><small>FOR YOU</small><h2>자주 찾는 메뉴</h2></div></div>
   <div className="homeDirectList">
    <Link href="/favorites"><span>♡</span><div><b>저장함</b><small>찜한 코스 {favoriteCount}개 · 장소 · 일정</small></div><em>›</em></Link>
    <Link href="/run/track"><span>🏟</span><div><b>트랙런</b><small>400m 자동랩 · 인터벌</small></div><em>›</em></Link>
    <Link href="/dashboard/activity"><span>◉</span><div><b>크루 최근 활동</b><small>최근 러닝과 참여 현황</small></div><em>›</em></Link>
   </div>
  </section>

  <section className="homeAdSlot" aria-label="프로모션 배너 영역">
   <div><small>TTWITTUN PARTNER</small><h2>러너에게 필요한 브랜드와 이벤트를<br/>이 공간에서 만날 수 있어요.</h2><p>향후 브랜드 제휴 · 크루 이벤트 · 대회 프로모션 배너 영역</p></div><span>AD</span>
  </section>
 </main>
}
