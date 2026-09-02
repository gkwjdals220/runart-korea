import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import ModerationButtons from "@/components/ModerationButtons";
import BulkCourseImport from "@/components/BulkCourseImport";
import {createClient} from "@/lib/supabase/server";

export default async function ManageCourses(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);const membership=mem?.[0],role=owned?"owner":membership?.role;if(!["owner","admin"].includes(role||""))redirect("/dashboard");
 const {data:pending}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,status,created_at").eq("status","pending").order("created_at",{ascending:false});
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/manage">← 운영센터</Link></header><section className="compactPageHero"><span className="eyebrow">COURSE MODERATION</span><h1>코스 승인</h1><p className="muted">승인 대기 코스와 DB 확장 기능을 분리해서 관리합니다.</p></section><div className="mobileCardList">{(pending||[]).map((x:any)=><article className="card mobileListCard mobileListAction" key={x.id}><div><small>{x.region} {x.city||""} · {Number(x.distance_km).toFixed(1)}km</small><h3>{x.name}</h3><p>{x.course_type}{x.art_shape?` · ${x.art_shape}`:""}</p></div><ModerationButtons courseId={x.id}/></article>)}{!(pending||[]).length&&<div className="card emptyState"><b>승인 대기 코스가 없습니다.</b></div>}</div><section className="section"><div className="card"><h2>전국 코스 DB 확장</h2><BulkCourseImport/></div></section></main>;
}
