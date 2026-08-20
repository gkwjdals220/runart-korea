import Link from "next/link";import Brand from "@/components/Brand";import {createClient} from "@/lib/supabase/server";
export default async function Home(){
 const sb=await createClient(); const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km").eq("status","approved").order("name");
 const arts=(courses||[]).filter(c=>c.course_type==="art");
 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/login">로그인</Link><Link className="btn" href="/dashboard">크루 대시보드</Link></div></header>
 <section className="hero"><h1>코스를 찾고,<br/>달리고, 기록한다.</h1><p className="muted">대한민국 러닝 코스 · 그리기 런 GPS ART · 뛰뚠뛰뚠 완주 기록을 한 곳에서.</p></section>
 <div className="stats"><div className="stat"><b>{courses?.length||0}</b><span className="muted">등록 코스</span></div><div className="stat"><b>{arts.length}</b><span className="muted">그리기 런</span></div><div className="stat"><b>GPX</b><span className="muted">업로드 지원</span></div><div className="stat"><b>CREW</b><span className="muted">공용 일지</span></div></div>
 <section className="section"><h2>코스</h2><div className="grid">{(courses||[]).map(c=><article className="card" key={c.id}><h3>{c.name}</h3><p className="muted">{c.region} {c.city} · {c.distance_km}km</p>{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape}</span>}</article>)}</div></section>
 </main>
}