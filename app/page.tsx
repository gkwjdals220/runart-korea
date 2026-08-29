import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import {createClient} from "@/lib/supabase/server";

function Rail({title,subtitle,courses}:{title:string;subtitle:string;courses:any[]}){
 return <section className="section discoverySection"><div className="sectionHead"><div><span className="eyebrow">CURATED</span><h2>{title}</h2><p className="muted">{subtitle}</p></div><a className="textLink" href="#explore">전체 탐색 →</a></div><div className="discoveryRail">{courses.slice(0,6).map(c=><Link href={`/courses/${c.id}`} className="discoveryCard" key={c.id}><div className="discoveryThumb"><span>{c.course_type==="art"?"🎨":c.night_recommended?"🌙":"🏃"}</span></div><div className="discoveryBody"><div className="metaRow"><span>{c.region} {c.city||""}</span>{c.verified&&<span className="tag">검증</span>}</div><h3>{c.name}</h3><p>{Number(c.distance_km).toFixed(1)}km · 난이도 {"★".repeat(c.difficulty||2)}</p><div className="metaRow">{(c.tags||[]).slice(0,2).map((t:string)=><span className="tag" key={t}>#{t}</span>)}</div></div></Link>)}</div></section>
}

export default async function Home(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:courses}=await sb.from("runart_courses")
  .select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality")
  .eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 let favoriteIds:string[]=[];
 if(user){const {data:favs}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id);favoriteIds=(favs||[]).map((x:any)=>x.course_id)}
 const art=normalized.filter(c=>c.course_type==="art").length;const verified=normalized.filter(c=>c.verified).length;
 const easy5=normalized.filter(c=>c.distance_km<=6&&c.difficulty<=2).sort((a,b)=>Number(b.verified)-Number(a.verified));
 const night=normalized.filter(c=>c.night_recommended).sort((a,b)=>(a.traffic_lights??99)-(b.traffic_lights??99));
 const fun=normalized.filter(c=>c.course_type==="art"||c.course_type==="theme");
 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/art">그리기 런</Link><Link className="btn ghost" href="/favorites">♥ 찜</Link><Link className="btn ghost" href="/races">대회</Link><Link className="btn" href="/dashboard">뛰뚠뛰뚠</Link></div></header>
 <section className="discoveryHero"><div><span className="eyebrow">RUNART DISCOVERY</span><h1>오늘은 어디서<br/>뛰어볼까요?</h1><p>코스부터 러닝 후 맛집까지, 한 번에 발견하세요.</p><a className="heroSearch" href="#explore"><span>⌕</span><b>지역, 거리, 분위기로 코스 찾기</b><em>검색</em></a><div className="quickThemes"><a href="#explore">🏃 5K 가볍게</a><a href="#explore">🌙 야간런</a><Link href="/art">🎨 그리기런</Link><a href="#explore">🚦 신호 적게</a></div></div><div className="heroMetricCard"><span className="eyebrow">RUNART NOW</span><b>{normalized.length}</b><p>전국 등록 코스</p><div><span>🎨 {art} 그리기런</span><span>✓ {verified} 검증코스</span></div></div></section>
 <Rail title="오늘은 가볍게 5K" subtitle="부담 없이 뛰기 좋은 짧고 쉬운 코스" courses={easy5}/>
 <Rail title="퇴근 후 야간 러닝" subtitle="밤에도 달리기 좋은 코스를 모았어요" courses={night}/>
 <Rail title="뛰는 재미가 있는 펀런" subtitle="그리기런·테마런처럼 기록도 추억이 되는 코스" courses={fun}/>
 <CourseExplorer courses={normalized as any} userId={user?.id||null} favoriteIds={favoriteIds}/></main>
}
