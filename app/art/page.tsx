import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function ArtPage(){
 const sb=await createClient();
 const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,art_shape,distance_km,tags,verified,start_name").eq("status","approved").eq("course_type","art").order("name");
 const {data:{user}}=await sb.auth.getUser();let done=new Set<string>();
 if(user){const {data:memberships}=await sb.from("runart_crew_members").select("crew_id").eq("user_id",user.id);const crewId=memberships?.[0]?.crew_id;if(crewId){const {data:logs}=await sb.from("runart_course_logs").select("course_id").eq("crew_id",crewId);done=new Set((logs||[]).map((x:any)=>x.course_id))}}
 const completed=(courses||[]).filter((c:any)=>done.has(c.id)).length;const rate=(courses||[]).length?Math.round(completed/(courses||[]).length*100):0;
 return <main className="wrap mobileSubPage artCollectionPage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/">홈</Link><Link className="btn" href="/dashboard">뛰뚠뛰뚠</Link></div></header>
 <section className="hero compact compactPageHero"><div><span className="eyebrow">GPS ART COLLECTION</span><h1>그리기 런 도감 🎨</h1><p className="muted">붕어빵·하트·동물·문자 등 달린 궤적이 그림이 되는 펀런 코스만 모았습니다.</p></div><div className="heroStats"><b>{courses?.length||0}</b><span>작품</span><b>{completed}</b><span>크루 완주</span><b>{rate}%</b><span>수집률</span></div></section>
 <div className="grid">{(courses||[]).map((c:any)=><Link href={`/courses/${c.id}`} className="card" key={c.id}><h3>{c.art_shape||c.name} {done.has(c.id)&&<span className="done">🏅</span>}</h3><p><b>{c.name}</b></p><p className="muted">{c.region} {c.city||""} · {Number(c.distance_km).toFixed(1)}km{c.start_name?` · ${c.start_name}`:""}</p><div className="metaRow"><span className="tag">🎨 GPS ART</span>{c.verified&&<span className="tag">✓ 검증</span>}{(c.tags||[]).slice(0,3).map((t:string)=><span className="tag" key={t}>#{t}</span>)}</div></Link>)}{!(courses||[]).length&&<div className="card muted">등록된 그리기 런이 없습니다.</div>}</div></main>
}
