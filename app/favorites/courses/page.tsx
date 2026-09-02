import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function FavoriteCourses(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:favs}=await sb.from("runart_favorites").select("created_at,runart_courses(id,name,region,city,distance_km,course_type,art_shape,night_recommended)").eq("user_id",user.id).order("created_at",{ascending:false});
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/favorites">← 저장함</Link></header><section className="compactPageHero"><span className="eyebrow">SAVED COURSES</span><h1>찜한 러닝 코스</h1><p className="muted">다음 러닝 후보만 모아서 빠르게 고르세요.</p></section><div className="mobileCardList">{(favs||[]).map((f:any)=>{const c=f.runart_courses;return <Link href={`/courses/${c.id}`} className="card mobileListCard" key={c.id}><div><small>{c.region} {c.city||""}{c.night_recommended?" · 🌙 야간추천":""}</small><h3>{c.name}</h3><p>{Number(c.distance_km).toFixed(1)}km{c.course_type==="art"&&c.art_shape?` · 🎨 ${c.art_shape}`:""}</p></div><b>›</b></Link>})}{!(favs||[]).length&&<div className="card emptyState"><b>아직 찜한 코스가 없어요.</b><Link className="btn" href="/explore">코스 찾기</Link></div>}</div></main>;
}
