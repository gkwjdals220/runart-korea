import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import InteractiveRunBoard from "@/components/InteractiveRunBoard";
import {createClient} from "@/lib/supabase/server";

function CourseRail({id,title,courses,subtitle}:{id:string;title:string;courses:any[];subtitle?:string}){
 if(!courses.length)return null;
 return <section className="simpleHomeSection" id={id}><div className="simpleSectionHead"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><a href="#explore">필터로 더 찾기 ›</a></div><div className="simpleRail">{courses.slice(0,12).map((c,i)=><Link href={`/courses/${c.id}`} className="simpleCourseCard" key={c.id}><div className={`simpleCoursePhoto photo${i%4}`}><span>{(c.tags||[]).some((t:string)=>["수변","호수","하천"].includes(t))?"🌊":c.course_type==="art"?"🎨":c.night_recommended?"🌙":Number(c.distance_km)<=6?"🏃":"🗺️"}</span><b>{c.verified?"검증":"추천"}</b></div><div><h3>{c.name}</h3><p>{c.region} {c.city||""} · {Number(c.distance_km).toFixed(1)}km</p><small>난이도 {"★".repeat(c.difficulty||2)}{c.toilets!=null?` · 🚻 ${c.toilets}`:""}</small><span className="cardActionText">코스 보기 →</span></div></Link>)}</div></section>
}

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality").eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 let favoriteIds:string[]=[];
 if(user){const {data:favs}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id);favoriteIds=(favs||[]).map((x:any)=>x.course_id)}
 const recommended=[...normalized].sort((a,b)=>Number(b.verified)-Number(a.verified)||Number(b.night_recommended)-Number(a.night_recommended)||a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const waterfront=normalized.filter(c=>(c.tags||[]).some((t:string)=>["수변","호수","하천"].includes(t))).sort((a,b)=>Number(b.verified)-Number(a.verified)||a.distance_km-b.distance_km).slice(0,24);
 const easyRuns=normalized.filter(c=>c.distance_km<=6).sort((a,b)=>a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const tenK=normalized.filter(c=>c.distance_km>6&&c.distance_km<=12).sort((a,b)=>Math.abs(a.distance_km-10)-Math.abs(b.distance_km-10)||a.difficulty-b.difficulty).slice(0,18);
 const nightRuns=normalized.filter(c=>c.night_recommended).sort((a,b)=>a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const artRuns=normalized.filter(c=>c.course_type==="art").sort((a,b)=>a.distance_km-b.distance_km).slice(0,18);
 const runEat=normalized.filter(c=>(c.route_geojson?.coordinates||[]).length>0||!!c.start_name).sort((a,b)=>Number(b.verified)-Number(a.verified)||a.distance_km-b.distance_km).slice(0,18);
 return <main className="wrap simpleHome">
 <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="홈 주요 메뉴"><a href="#recommend">추천</a><a href="#waterfront">수변</a><a href="#art-runs">GPS 아트</a><a href="#explore">코스 탐색</a><Link href="/dashboard">크루</Link></nav><div className="nav"><Link className="btn ghost" href="/favorites">♡ 찜</Link><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
 <section className="simpleIntro"><span className="introPill">RUN · DISCOVER · EAT</span><h1>러닝은 여행이 되고,<br className="mobileBreak"/> 도시는 놀이터가 된다!</h1><p>코스를 고르고, 달리고, 주변 장소까지 한 번에 이어보세요.</p><div className="heroActions"><a className="btn" href="#explore">🔎 코스 찾기</a><a className="btn ghost" href="#recommend">✨ 추천부터 보기</a></div></section>
 <div className="homeQuickNav" aria-label="빠른 이동"><a href="#recommend">✨ 추천</a><a href="#waterfront">🌊 수변</a><a href="#easy-runs">🏃 6K 이하</a><a href="#challenge-runs">💪 7~12K</a><a href="#night-runs">🌙 야간</a><a href="#art-runs">🎨 GPS 아트</a><a href="#run-eat">🍴 RUN + EAT</a></div>
 <InteractiveRunBoard/>
 <section className="journeySteps"><a href="#explore"><b>🗺️ 1. 코스 선택</b><span>검색·필터·지도로 골라요</span></a><a href="#explore"><b>🚗 2. 출발 준비</b><span>코스 상세에서 주차·화장실을 확인해요</span></a><a href="#explore"><b>🏃 3. 러닝 시작</b><span>코스를 고른 뒤 라이브 러닝 모드로 달려요</span></a><Link href="/favorites"><b>♥ 4. 저장 & 다시보기</b><span>기록과 RUN + EAT을 남겨요</span></Link></section>
 <CourseRail id="recommend" title="오늘의 추천 코스" subtitle="검증·난이도·코스 특성을 반영한 추천" courses={recommended}/>
 <CourseRail id="waterfront" title="🌊 호수·하천 수변 러닝" subtitle="서울·경기의 호수와 하천을 따라 달리는 코스" courses={waterfront}/>
 <CourseRail id="easy-runs" title="가볍게 6K 이하" subtitle="부담 없이 시작하기 좋은 짧은 러닝" courses={easyRuns}/>
 <CourseRail id="challenge-runs" title="7~12K 도전 코스" subtitle="조금 더 달리고 싶은 날" courses={tenK}/>
 <CourseRail id="night-runs" title="야간 러닝 추천" subtitle="저녁 러닝에 어울리는 코스" courses={nightRuns}/>
 <CourseRail id="art-runs" title="GPS 아트 & 테마런" subtitle="달리면서 색다른 코스를 즐겨보세요" courses={artRuns}/>
 <CourseRail id="run-eat" title="RUN + EAT 추천" subtitle="러닝 후 주변 맛집과 카페까지" courses={runEat}/>
 <section className="activitySummary"><div className="simpleSectionHead"><h2>내 활동 요약</h2><Link href="/my">MY ›</Link></div><div className="activityGrid"><div><span>👟</span><small>등록 코스</small><b>{normalized.length}<em>개</em></b></div><Link href="/favorites"><span>📍</span><small>찜한 코스</small><b>{favoriteIds.length}<em>개</em></b></Link><Link href="/favorites"><span>🍽️</span><small>RUN + EAT</small><b>→</b></Link><Link href="/my"><span>♥</span><small>내 기록</small><b>→</b></Link></div></section>
 <section className="exploreReveal" id="explore"><div className="simpleSectionHead"><div><h2>코스 탐색</h2><p>지역·거리·노면·주차·야간 조건까지 한 번에 골라보세요.</p></div><a href="#top">맨 위로 ↑</a></div><CourseExplorer courses={normalized as any} userId={user?.id||null} favoriteIds={favoriteIds}/></section>
 </main>
}
