import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import {createClient} from "@/lib/supabase/server";

function CourseRail({title,courses,subtitle}:{title:string;courses:any[];subtitle?:string}){
 if(!courses.length)return null;
 return <section className="simpleHomeSection"><div className="simpleSectionHead"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><a href="#explore">전체 코스 보기 ›</a></div><div className="simpleRail">{courses.slice(0,12).map((c,i)=><Link href={`/courses/${c.id}`} className="simpleCourseCard" key={c.id}><div className={`simpleCoursePhoto photo${i%4}`}><span>{c.course_type==="art"?"🎨":c.night_recommended?"🌙":Number(c.distance_km)<=6?"🏃":"🗺️"}</span><b>{c.verified?"검증":"추천"}</b></div><div><h3>{c.name}</h3><p>{c.region} {c.city||""} · {Number(c.distance_km).toFixed(1)}km</p><small>난이도 {"★".repeat(c.difficulty||2)}{c.toilets!=null?` · 🚻 ${c.toilets}`:""}</small></div></Link>)}</div></section>
}

function BoardGame(){
 const top=["START","🌳 한강공원","💦 난지한강공원","☕ 카페거리","🎨 아트 포인트","❓ CHANCE"];
 const left=["📍 아트 포인트","🏯 한옥마을","⌂ 산책길","🎲 CHANCE"];
 const right=["🍴 맛집","🌳 숲길","📍 아트 포인트","🚉 역세권"];
 const bottom=["🗼 랜드마크","⛰ 둘레길","☕ 카페","🌳 공원","🏁 GOAL"];
 return <section className="runartBoard" aria-label="RUNART 러닝 보드"><div className="boardTop">{top.map((x,i)=><div className={`boardTile t${i}`} key={x}>{x}</div>)}</div><div className="boardMiddle"><div className="boardSide">{left.map(x=><div className="boardTile" key={x}>{x}</div>)}</div><div className="boardCenter"><span className="boardBrand">RUNART <i>KOREA</i></span><div className="runnerScene">🏃‍♀️　🏃‍♂️</div><p>오늘은 어디로 달려볼까?</p><span className="dice">⚄ ⚂</span></div><div className="boardSide">{right.map(x=><div className="boardTile" key={x}>{x}</div>)}</div></div><div className="boardBottom">{bottom.map((x,i)=><div className={`boardTile b${i}`} key={x}>{x}</div>)}</div></section>
}

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality").eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 let favoriteIds:string[]=[];
 if(user){const {data:favs}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id);favoriteIds=(favs||[]).map((x:any)=>x.course_id)}
 const recommended=[...normalized].sort((a,b)=>Number(b.verified)-Number(a.verified)||Number(b.night_recommended)-Number(a.night_recommended)||a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const easyRuns=normalized.filter(c=>c.distance_km<=6).sort((a,b)=>a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const tenK=normalized.filter(c=>c.distance_km>6&&c.distance_km<=12).sort((a,b)=>Math.abs(a.distance_km-10)-Math.abs(b.distance_km-10)||a.difficulty-b.difficulty).slice(0,18);
 const nightRuns=normalized.filter(c=>c.night_recommended).sort((a,b)=>a.difficulty-b.difficulty||a.distance_km-b.distance_km).slice(0,18);
 const artRuns=normalized.filter(c=>c.course_type==="art").sort((a,b)=>a.distance_km-b.distance_km).slice(0,18);
 const runEat=normalized.filter(c=>(c.route_geojson?.coordinates||[]).length>0||!!c.start_name).sort((a,b)=>Number(b.verified)-Number(a.verified)||a.distance_km-b.distance_km).slice(0,18);
 return <main className="wrap simpleHome"><header className="top simpleTop"><Brand/><div className="nav"><Link className="btn ghost" href="/favorites">♡ 찜</Link><Link className="btn" href={user?"/my":"/login"}>{user?"MY":"로그인"}</Link></div></header>
 <section className="simpleIntro"><h1>러닝은 여행이 되고,<br className="mobileBreak"/> 도시는 놀이터가 된다!</h1><p>보드게임처럼 코스를 따라 아트와 맛집을 발견하세요.</p></section>
 <BoardGame/>
 <section className="journeySteps"><Link href="#explore"><b>🗺️ 1. 코스 선택</b><span>보드에서 코스를 골라요</span></Link><Link href="#explore"><b>🏃 2. 러닝 시작</b><span>아트포인트를 만나보세요</span></Link><Link href="#explore"><b>🍴 3. 맛집/카페 발견</b><span>주변 장소를 찾아요</span></Link><Link href="/favorites"><b>♥ 4. RUN + EAT 저장</b><span>나만의 여행을 저장해요</span></Link></section>
 <CourseRail title="오늘의 추천 코스" subtitle="검증·난이도·코스 특성을 반영한 추천" courses={recommended}/>
 <CourseRail title="가볍게 6K 이하" subtitle="부담 없이 시작하기 좋은 짧은 러닝" courses={easyRuns}/>
 <CourseRail title="7~12K 도전 코스" subtitle="조금 더 달리고 싶은 날" courses={tenK}/>
 <CourseRail title="야간 러닝 추천" subtitle="저녁 러닝에 어울리는 코스" courses={nightRuns}/>
 <CourseRail title="GPS 아트 & 테마런" subtitle="달리면서 색다른 코스를 즐겨보세요" courses={artRuns}/>
 <CourseRail title="RUN + EAT 추천" subtitle="러닝 후 주변 맛집과 카페까지" courses={runEat}/>
 <section className="activitySummary"><div className="simpleSectionHead"><h2>내 활동 요약</h2><Link href="/my">MY ›</Link></div><div className="activityGrid"><div><span>👟</span><small>등록 코스</small><b>{normalized.length}<em>개</em></b></div><div><span>📍</span><small>찜한 코스</small><b>{favoriteIds.length}<em>개</em></b></div><div><span>🍽️</span><small>RUN + EAT</small><b>→</b></div><div><span>♥</span><small>내 기록</small><b>→</b></div></div></section>
 <section className="exploreReveal" id="explore"><div className="simpleSectionHead"><div><h2>코스 탐색</h2><p>원하는 지역과 거리로 자세히 찾아보세요.</p></div></div><CourseExplorer courses={normalized as any} userId={user?.id||null} favoriteIds={favoriteIds}/></section>
 </main>
}
