import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import InteractiveRunBoard from "@/components/InteractiveRunBoard";
import {createClient} from "@/lib/supabase/server";

function CourseRail({id,title,courses,subtitle}:{id:string;title:string;courses:any[];subtitle?:string}){
 if(!courses.length)return null;
 return <section className="simpleHomeSection" id={id}><div className="simpleSectionHead"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><a href="#explore">필터로 더 찾기 ›</a></div><div className="simpleRail">{courses.slice(0,10).map((c,i)=><Link href={`/courses/${c.id}`} className="simpleCourseCard" key={c.id}><div className={`simpleCoursePhoto photo${i%4}`}><span>{(c.tags||[]).some((t:string)=>["수변","호수","하천"].includes(t))?"🌊":c.course_type==="art"?"🎨":c.night_recommended?"🌙":Number(c.distance_km)<=6?"🏃":"🗺️"}</span><b>{c.verified?"검증":"추천"}</b></div><div><h3>{c.name}</h3><p>{c.region} {c.city||""} · {Number(c.distance_km).toFixed(1)}km</p><small>난이도 {"★".repeat(c.difficulty||2)}{c.toilets!=null?` · 🚻 ${c.toilets}`:""}</small><span className="cardActionText">상세 · 출발 준비 →</span></div></Link>)}</div></section>
}

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality").eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 let favoriteIds:string[]=[];
 if(user){const {data:favs}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id);favoriteIds=(favs||[]).map((x:any)=>x.course_id)}
 const recommended=[...normalized].sort((a,b)=>Number(b.verified)-Number(a.verified)||Number(b.night_recommended)-Number(a.night_recommended)||a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,16);
 const waterfront=normalized.filter(c=>(c.tags||[]).some((t:string)=>["수변","호수","하천"].includes(t))).sort((a,b)=>Number(b.verified)-Number(a.verified)||a.distance_km-b.distance_km).slice(0,20);
 const artRuns=normalized.filter(c=>c.course_type==="art").sort((a,b)=>a.distance_km-b.distance_km).slice(0,16);
 const runEat=normalized.filter(c=>(c.route_geojson?.coordinates||[]).length>0||!!c.start_name).sort((a,b)=>Number(b.verified)-Number(a.verified)||a.distance_km-b.distance_km).slice(0,16);
 return <main className="wrap simpleHome">
 <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="홈 주요 메뉴"><a href="#recommend">추천</a><a href="#waterfront">수변</a><a href="#art-runs">GPS 아트</a><a href="#run-eat">RUN + EAT</a><a href="#explore">코스 탐색</a><Link href="/dashboard">크루</Link></nav><div className="nav"><Link className="btn ghost" href="/favorites">♡ 찜</Link><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
 <section className="simpleIntro"><span className="introPill">RUN · DISCOVER · EAT</span><h1>오늘 달릴 코스를 고르고,<br className="mobileBreak"/> 바로 출발하세요.</h1><p>코스 탐색부터 주차·화장실·라이브 러닝·맛집까지 하나의 흐름으로 이어집니다.</p><div className="heroActions"><a className="btn" href="#explore">🔎 코스 바로 찾기</a><a className="btn ghost" href="#recommend">✨ 추천 코스 보기</a></div></section>
 <div className="homeQuickNav" aria-label="빠른 이동"><a href="#recommend">✨ 추천</a><a href="#waterfront">🌊 수변</a><a href="#art-runs">🎨 GPS 아트</a><a href="#run-eat">🍴 RUN + EAT</a><a href="#explore">🔎 전체 탐색</a></div>
 <section className="serviceFlowBar" aria-label="RUNART 이용 흐름"><a href="#explore"><b>1</b><span><strong>코스 선택</strong><small>검색·지도·필터</small></span></a><span className="flowArrow">→</span><a href="#explore"><b>2</b><span><strong>출발 준비</strong><small>주차·화장실</small></span></a><span className="flowArrow">→</span><a href="#explore"><b>3</b><span><strong>라이브 러닝</strong><small>GPS·페이스·기록</small></span></a><span className="flowArrow">→</span><Link href="/my"><b>4</b><span><strong>저장 & 다시보기</strong><small>MY · RUN + EAT</small></span></Link></section>
 <InteractiveRunBoard/>
 <CourseRail id="recommend" title="오늘의 추천 코스" subtitle="처음 들어왔다면 여기서 하나 골라보세요." courses={recommended}/>
 <CourseRail id="waterfront" title="🌊 호수·하천 수변 러닝" subtitle="경치와 동선을 함께 챙기기 좋은 수변 코스" courses={waterfront}/>
 <CourseRail id="art-runs" title="🎨 GPS 아트 & 테마런" subtitle="달리는 과정 자체가 콘텐츠가 되는 코스" courses={artRuns}/>
 <CourseRail id="run-eat" title="🍴 RUN + EAT 추천" subtitle="러닝 후 주변 맛집과 카페까지 이어지는 코스" courses={runEat}/>
 <section className="activitySummary"><div className="simpleSectionHead"><h2>내 활동 요약</h2><Link href="/my">MY ›</Link></div><div className="activityGrid"><div><span>👟</span><small>등록 코스</small><b>{normalized.length}<em>개</em></b></div><Link href="/favorites"><span>📍</span><small>찜한 코스</small><b>{favoriteIds.length}<em>개</em></b></Link><Link href="/favorites"><span>🍽️</span><small>RUN + EAT</small><b>→</b></Link><Link href="/my"><span>♥</span><small>내 기록</small><b>→</b></Link></div></section>
 <section className="exploreReveal" id="explore"><div className="simpleSectionHead"><div><h2>코스 탐색</h2><p>원하는 조건으로 찾고, 코스를 선택하면 지도에서 바로 확인할 수 있어요.</p></div><a href="#top">맨 위로 ↑</a></div><CourseExplorer courses={normalized as any} userId={user?.id||null} favoriteIds={favoriteIds}/></section>
 </main>
}
