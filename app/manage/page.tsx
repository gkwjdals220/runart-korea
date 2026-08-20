import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import ModerationButtons from "@/components/ModerationButtons";
import JoinRequestActions from "@/components/JoinRequestActions";
import BulkCourseImport from "@/components/BulkCourseImport";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Manage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:ownedCrew}=await sb.from("runart_crews").select("id,name,slug").eq("owner_id",user.id).maybeSingle();
 const {data:memberships}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=memberships?.[0];const role=ownedCrew?"owner":membership?.role;const crewId=ownedCrew?.id||membership?.crew_id;const admin=["owner","admin"].includes(role||"");if(!admin)redirect("/dashboard");
 const {data:pending}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,status,source_name,created_at").eq("status","pending").order("created_at",{ascending:false});
 const {data:joinReqs}=crewId?await sb.from("runart_crew_join_requests").select("id,user_id,message,status,created_at").eq("crew_id",crewId).eq("status","pending").order("created_at",{ascending:true}):{data:[] as any[]};
 const ids=Array.from(new Set((joinReqs||[]).map((x:any)=>x.user_id)));const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const {data:members}=crewId?await sb.from("runart_crew_members").select("user_id,role,joined_at").eq("crew_id",crewId).order("joined_at",{ascending:true}):{data:[] as any[]};
 const memberIds=Array.from(new Set((members||[]).map((x:any)=>x.user_id)));const {data:memberProfiles}=memberIds.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",memberIds):{data:[] as any[]};const memberNames=new Map((memberProfiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">대시보드</Link><Link className="btn ghost" href="/">지도</Link><Link className="btn ghost" href="/art">그리기 런</Link><LogoutButton/></div></header>
 <section className="hero compact"><h1>운영 센터</h1><p className="muted">크루원 · 코스 제보 · 전국 코스 DB를 관리합니다.</p></section><div className="card"><b>현재 권한: {role}</b>{ownedCrew&&<span className="muted"> · {ownedCrew.name}</span>}</div>
 <section className="section"><h2>크루 가입 신청</h2>{(joinReqs||[]).length?(joinReqs||[]).map((x:any)=><article className="card moderationCard" key={x.id}><div><h3>{names.get(x.user_id)||"신규 러너"}</h3><p className="muted">{x.message||"가입 메시지 없음"}</p><small className="muted">{new Date(x.created_at).toLocaleString("ko-KR")}</small></div><JoinRequestActions requestId={x.id}/></article>):<div className="card muted">대기 중인 가입 신청이 없습니다.</div>}</section>
 <section className="section"><h2>현재 크루원</h2><div className="grid">{(members||[]).map((m:any)=><div className="card" key={m.user_id}><h3>{memberNames.get(m.user_id)||"러너"}</h3><p className="muted">권한: {m.role}</p></div>)}</div></section>
 <section className="section"><h2>승인 대기 코스</h2>{(pending||[]).length?(pending||[]).map((x:any)=><article className="card moderationCard" key={x.id}><div><h3>{x.name}</h3><p className="muted">{x.region} {x.city} · {Number(x.distance_km).toFixed(1)}km · {x.course_type}{x.art_shape?` · ${x.art_shape}`:""}</p><span className="tag">pending</span></div><ModerationButtons courseId={x.id}/></article>):<div className="card muted">승인 대기 코스가 없습니다.</div>}</section>
 <section className="section"><h2>전국 코스 DB 확장</h2><BulkCourseImport/></section></main>
}
