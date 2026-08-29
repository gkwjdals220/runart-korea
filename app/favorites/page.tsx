import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function Favorites(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:favs}=await sb.from("runart_favorites")
  .select("created_at,runart_courses(id,name,region,city,distance_km,course_type,art_shape,night_recommended)")
  .eq("user_id",user.id).order("created_at",{ascending:false});
 const {data:placeFavs}=await sb.from("runart_place_favorites")
  .select("created_at,runart_places(id,name,category,region,city,address,source_url,verified)")
  .eq("user_id",user.id).order("created_at",{ascending:false});

 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/">코스 탐색</Link><Link className="btn ghost" href="/dashboard">크루</Link></div></header>
 <section className="hero compact"><div><span className="eyebrow">MY RUNART</span><h1>내 찜 목록</h1><p className="muted">다음에 달릴 코스와 러닝 후 가볼 장소를 함께 모아두세요.</p></div></section>
 <section className="section"><div className="sectionHead"><div><h2>♥ 찜한 러닝 코스</h2><p className="muted">다음 러닝 후보를 한눈에 확인하세요.</p></div><span className="tag">{(favs||[]).length}개</span></div><div className="grid">{(favs||[]).map((f:any)=>{const c=f.runart_courses;return <Link href={`/courses/${c.id}`} className="card" key={c.id}><div className="metaRow"><span>{c.region} {c.city}</span>{c.night_recommended&&<span>🌙</span>}</div><h3>{c.name}</h3><p className="muted">{Number(c.distance_km).toFixed(1)}km</p>{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape}</span>}</Link>})}
 {!(favs||[]).length&&<div className="card muted">아직 찜한 코스가 없습니다. 홈에서 ♥ 버튼을 눌러보세요.</div>}</div></section>
 <section className="section"><div className="sectionHead"><div><h2>🍚 찜한 맛집·카페</h2><p className="muted">러닝 후 먹방 후보도 RUNART에 같이 저장합니다.</p></div><span className="tag">{(placeFavs||[]).length}개</span></div><div className="savedPlaceGrid">{(placeFavs||[]).map((f:any)=>{const p=f.runart_places;return <article className="card" key={p.id}><div className="placeBadge">{p.category==="cafe"?"CAFE":"FOOD"}{p.verified?" · VERIFIED":""}</div><h3>{p.name}</h3><p className="muted">{p.address||`${p.region||""} ${p.city||""}`}</p>{p.source_url&&<a className="textLink" href={p.source_url} target="_blank" rel="noreferrer">장소 상세 →</a>}</article>})}{!(placeFavs||[]).length&&<div className="card muted">아직 찜한 맛집·카페가 없습니다. 코스 상세의 ‘뛰고 나서 어디 갈까?’에서 저장할 수 있습니다.</div>}</div></section>
 </main>
}
