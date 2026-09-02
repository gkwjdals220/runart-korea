import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function CompletedCoursesPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();
 const {data:memberships}=await sb.from("runart_crew_members").select("crew_id").eq("user_id",user.id);
 const crewId=owned?.id||memberships?.[0]?.crew_id;
 if(!crewId)redirect("/join");
 const {data:logs}=await sb.from("runart_course_logs").select("id,course_id,run_date,actual_distance_km,runart_courses(id,name,region,city,distance_km,course_type,art_shape)").eq("crew_id",crewId).order("run_date",{ascending:false}).limit(300);
 const logIds=(logs||[]).map((l:any)=>l.id);
 const {data:parts}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};
 const mine=new Set((parts||[]).filter((p:any)=>p.user_id===user.id).map((p:any)=>p.log_id));
 const latest=new Map<string,any>();
 for(const l of (logs||[]) as any[]){if(!mine.has(l.id)||!l.course_id||latest.has(l.course_id))continue;latest.set(l.course_id,l)}
 const rows=[...latest.values()];
 return <main className="wrap mobileSubPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">← 크루</Link><Link className="btn" href="/explore">코스 찾기</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">COMPLETED</span><h1>내 완주 코스</h1><p className="muted">크루 러닝에서 참여한 코스를 한곳에서 확인합니다.</p></section>
  <div className="mobileCardList">{rows.map((l:any)=>{const c=l.runart_courses;return <Link className="card mobileListCard" href={`/courses/${c?.id||l.course_id}`} key={l.course_id}><div><small>최근 완주 {l.run_date}</small><h3>{c?.name||"러닝 코스"}</h3><p>{c?.region||""} {c?.city||""} · {Number(l.actual_distance_km||c?.distance_km||0).toFixed(1)}km</p>{c?.course_type==="art"&&<small>🎨 {c.art_shape}</small>}</div><b>›</b></Link>})}{!rows.length&&<div className="card emptyState"><b>아직 완주 코스가 없어요.</b><p className="muted">코스를 골라 첫 크루 러닝 기록을 남겨보세요.</p><Link className="btn" href="/explore">코스 찾기</Link></div>}</div>
 </main>;
}
