import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function FavoritePlans(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:plans}=await sb.from("runart_run_eat_plans").select("id,title,created_at,runart_courses(id,name,distance_km),runart_places(id,name,category)").eq("user_id",user.id).order("created_at",{ascending:false});
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/favorites">← 저장함</Link></header><section className="compactPageHero"><span className="eyebrow">RUN + EAT</span><h1>저장한 일정</h1><p className="muted">러닝과 식사 계획을 일정 단위로 확인하세요.</p></section><div className="mobileCardList">{(plans||[]).map((x:any)=><Link href={`/plans/${x.id}`} className="card mobileListCard" key={x.id}><div><small>RUN + EAT</small><h3>{x.title}</h3><p>🏃 {x.runart_courses?.name} · {Number(x.runart_courses?.distance_km||0).toFixed(1)}km</p><p>{x.runart_places?.category==="cafe"?"☕":"🍚"} {x.runart_places?.name}</p></div><b>›</b></Link>)}{!(plans||[]).length&&<div className="card emptyState"><b>아직 저장한 일정이 없어요.</b><Link className="btn" href="/explore">코스 찾기</Link></div>}</div></main>;
}
