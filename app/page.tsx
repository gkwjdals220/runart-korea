import Link from "next/link";
import Image from "next/image";
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
  {href:"/run/free",label:"오늘의 러닝 바로 시작",image:"/home-assets/banner-run.png"},
  {href:"/races",label:"다음 러닝 대회 목표 확인",image:"/home-assets/banner-race.png"},
  {href:"/explore",label:`${courseCount||0}개 러닝 코스 찾기`,image:"/home-assets/banner-course.png"}
 ];
 return <main className="wrap simpleHome actionHome">
  <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="주요 메뉴"><Link href="/explore">코스 탐색</Link><Link href="/run/free">RUN</Link><Link href="/races">대회</Link><Link href="/dashboard">크루</Link><Link href="/my">MY</Link></nav><div className="nav"><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
  <HomePromoCarousel cards={promos}/>
  <section className="homeActionSection"><div className="homeSectionTitle"><div><small>QUICK START</small><h2>무엇을 할까요?</h2></div></div><div className="homeQuickGrid"><Link className="quickImageCard" aria-label="코스 찾기" href="/explore"><Image src="/home-assets/quick-course.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="트레드밀 페이스 계산" href="/run/treadmill"><Image src="/home-assets/quick-treadmill.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="러닝화 추천과 출시 정보" href="/shoes"><Image src="/home-assets/quick-shoes.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard primary" aria-label="GPS 러닝 시작" href="/run/free"><Image src="/home-assets/quick-run.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="내 러닝 기록" href="/my/history"><Image src="/home-assets/quick-history.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="개인 최고 기록 PB" href="/my/pb"><Image src="/home-assets/quick-pb.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="러닝 크루 활동" href="/dashboard"><Image src="/home-assets/quick-crew.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link><Link className="quickImageCard" aria-label="러닝 대회 일정" href="/races"><Image src="/home-assets/quick-races.png" alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link></div></section>
  <section className="homeActionSection compactHomeSection"><div className="homeSectionTitle"><div><small>FOR YOU</small><h2>자주 찾는 메뉴</h2></div></div><div className="homeDirectList"><Link href="/favorites"><span>♡</span><div><b>저장함</b><small>찜한 코스 {favoriteCount}개 · 장소 · 일정</small></div><em>›</em></Link>{user&&<Link href="/races/my"><span>🏁</span><div><b>내 대회 일정</b><small>{nextRace?`${raceDday(nextRace.race_date)} · ${nextRace.race_name}`:"저장한 참가 일정을 확인"}</small></div><em>›</em></Link>}<Link href="/run/track"><span>🏟</span><div><b>트랙런</b><small>400m 자동랩 · 인터벌</small></div><em>›</em></Link><Link href="/dashboard/activity"><span>◉</span><div><b>크루 최근 활동</b><small>최근 러닝과 참여 현황</small></div><em>›</em></Link></div></section>
  <section className="homeAdSlot" aria-label="프로모션 배너 영역"><div><small>TTWITTUN PARTNER</small><h2>러너에게 필요한 브랜드와 이벤트를<br/>이 공간에서 만날 수 있어요.</h2><p>브랜드 제휴 · 크루 이벤트 · 대회 프로모션 영역</p></div><span>AD</span></section>
 </main>
}
