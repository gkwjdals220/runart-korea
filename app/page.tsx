import Link from "next/link";
import Brand from "@/components/Brand";
import InteractiveRunBoard from "@/components/InteractiveRunBoard";
import {createClient} from "@/lib/supabase/server";

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {count:courseCount}=await sb.from("runart_courses").select("id",{count:"exact",head:true}).eq("status","approved");
 let favoriteCount=0;
 if(user){const {count}=await sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id);favoriteCount=count||0}
 return <main className="wrap simpleHome boardHome">
  <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="주요 메뉴"><Link href="/explore">코스 탐색</Link><Link href="/run/free">자유 러닝</Link><Link href="/my">내 기록</Link><Link href="/dashboard">크루</Link><Link href="/races">대회</Link></nav><div className="nav"><Link className="btn ghost" href="/favorites">♡ 찜</Link><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
  <section className="simpleIntro boardIntro"><span className="introPill">TTWITTUN · RUN BOARD</span><h1>오늘 달릴 걸<br className="mobileBreak"/> 한 화면에서 고르세요.</h1><p>홈은 선택만 하는 보드로 단순화했습니다. 코스 탐색·기록·크루·대회는 각각 독립 페이지에서 집중해서 사용하세요.</p></section>
  <section className="mobilePrimaryActions boardPrimaryActions" aria-label="빠른 시작"><Link href="/explore"><span>🔎</span><b>코스</b><small>{courseCount||0}개</small></Link><Link href="/run/free" className="primary"><span>▶</span><b>RUN</b><small>바로 시작</small></Link><Link href="/my"><span>⌁</span><b>기록</b><small>PB·히스토리</small></Link><Link href="/dashboard"><span>◉</span><b>크루</b><small>활동 관리</small></Link></section>
  <InteractiveRunBoard/>
  <section className="homeBoardGrid" aria-label="서비스 보드">
   <Link href="/explore" className="homeBoardCard"><span>🗺️</span><div><b>코스 찾기</b><small>지도 · 검색 · 필터</small></div><em>→</em></Link>
   <Link href="/favorites" className="homeBoardCard"><span>♡</span><div><b>찜한 코스</b><small>{favoriteCount}개 저장</small></div><em>→</em></Link>
   <Link href="/races" className="homeBoardCard"><span>🏁</span><div><b>대회</b><small>참가 일정 관리</small></div><em>→</em></Link>
   <Link href="/my" className="homeBoardCard"><span>📊</span><div><b>MY</b><small>러닝 기록 · PB</small></div><em>→</em></Link>
   <Link href="/dashboard" className="homeBoardCard"><span>👥</span><div><b>크루</b><small>출석 · 활동</small></div><em>→</em></Link>
   <Link href="/run/track" className="homeBoardCard"><span>🏟️</span><div><b>트랙런</b><small>400m · 인터벌</small></div><em>→</em></Link>
  </section>
 </main>
}
