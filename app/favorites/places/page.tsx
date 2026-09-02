import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function FavoritePlaces(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:rows}=await sb.from("runart_place_favorites").select("created_at,runart_places(id,name,category,region,city,address,source_url,verified)").eq("user_id",user.id).order("created_at",{ascending:false});
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/favorites">← 저장함</Link></header><section className="compactPageHero"><span className="eyebrow">SAVED PLACES</span><h1>찜한 맛집·카페</h1><p className="muted">러닝 후 갈 곳만 따로 모아뒀어요.</p></section><div className="mobileCardList">{(rows||[]).map((f:any)=>{const p=f.runart_places;return <article className="card mobileListCard" key={p.id}><div><small>{p.category==="cafe"?"☕ CAFE":"🍚 FOOD"}{p.verified?" · VERIFIED":""}</small><h3>{p.name}</h3><p>{p.address||`${p.region||""} ${p.city||""}`}</p>{p.source_url&&<a className="textLink" href={p.source_url} target="_blank" rel="noreferrer">장소 보기 →</a>}</div></article>})}{!(rows||[]).length&&<div className="card emptyState"><b>아직 저장한 장소가 없어요.</b><Link className="btn" href="/explore">코스부터 찾기</Link></div>}</div></main>;
}
