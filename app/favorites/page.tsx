import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function Favorites(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:favs}=await sb.from("runart_favorites")
  .select("created_at,runart_courses(id,name,region,city,distance_km,course_type,art_shape)")
  .eq("user_id",user.id).order("created_at",{ascending:false});

 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/">전국 지도</Link></div></header>
 <section className="hero compact"><h1>내 즐겨찾기</h1><p className="muted">다음에 달리고 싶은 코스를 모아두세요.</p></section>
 <div className="grid">{(favs||[]).map((f:any)=>{const c=f.runart_courses;return <Link href={`/courses/${c.id}`} className="card" key={c.id}><h3>{c.name}</h3><p className="muted">{c.region} {c.city} · {Number(c.distance_km).toFixed(1)}km</p>{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape}</span>}</Link>})}
 {!(favs||[]).length&&<div className="card muted">아직 즐겨찾기한 코스가 없습니다.</div>}</div></main>
}
