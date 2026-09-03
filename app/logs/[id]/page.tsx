import {redirect,notFound} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import EditRunLogForm from "@/components/EditRunLogForm";
import {createClient} from "@/lib/supabase/server";

export default async function EditLogPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:log}=await sb.from("runart_course_logs").select("id,crew_id,course_id,created_by,run_date,actual_distance_km,memo").eq("id",id).maybeSingle();if(!log)notFound();
 const {data:owned}=await sb.from("runart_crews").select("id").eq("id",log.crew_id).eq("owner_id",user.id).maybeSingle();
 const {data:membership}=await sb.from("runart_crew_members").select("role").eq("crew_id",log.crew_id).eq("user_id",user.id).maybeSingle();
 const canEdit=log.created_by===user.id||!!owned||["owner","admin"].includes(membership?.role||"");if(!canEdit)redirect("/dashboard");
 const {data:courses}=await sb.from("runart_courses").select("id,name,distance_km").eq("status","approved").order("name");
 const {data:memberRows}=await sb.from("runart_crew_members").select("user_id,role").eq("crew_id",log.crew_id);const ids=(memberRows||[]).map((m:any)=>m.user_id);const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));const members=(memberRows||[]).map((m:any)=>({...m,display_name:names.get(m.user_id)||"러너"}));
 const {data:parts}=await sb.from("runart_log_participants").select("user_id").eq("log_id",id);
 return <main className="wrap detailPage ttwittunDetailPage editLogDetailPage"><header className="top detailTop"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">← 대시보드</Link></div></header><section className="hero compact detailHero card discoveryDetail"><div><span className="eyebrow">RUN LOG</span><h1>러닝 기록 수정</h1><p className="muted">날짜·코스·거리·메모·실제 참여자를 다시 편집할 수 있습니다.</p></div></section><div className="detailFormWrap"><EditRunLogForm logId={id} initialCourseId={log.course_id} initialDate={log.run_date} initialDistance={log.actual_distance_km?Number(log.actual_distance_km):null} initialMemo={log.memo} initialParticipants={(parts||[]).map((p:any)=>p.user_id)} courses={(courses||[]).map((c:any)=>({...c,distance_km:Number(c.distance_km)}))} members={members as any}/></div></main>
}
