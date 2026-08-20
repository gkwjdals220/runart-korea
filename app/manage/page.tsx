import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import ModerationButtons from "@/components/ModerationButtons";
import JoinRequestActions from "@/components/JoinRequestActions";
import BulkCourseImport from "@/components/BulkCourseImport";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Manage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:ownedCrew}=await sb.from("runart_crews").select("id,name,slug").eq("owner_id",user.id).maybeSingle();
 const {data:memberships}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=memberships?.[0];const role=ownedCrew?"owner":membership?.role;const crewId=ownedCrew?.id||membership?.crew_id;const admin=["owner","admin"].includes(role||"");if(!admin)redirect("/dashboard");

 const {data:pending}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,status,source_name,created_at").eq("status","pending").order("created_at",{ascending:false});
 const {data:joinReqs}=crewId?await sb.from("runart_crew_join_requests").select("id,user_id,message,status,created_at").eq("crew_id",crewId).eq("status","pending").order("created_at",{ascending:true}):{data:[] as any[]};
 const ids=Array.from(new Set((joinReqs||[]).map((x:any)=>x.user_id)));const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));

 const {data:members}=crewId?await sb.from("runart_crew_members").select("user_id,role,joined_at").eq("crew_id",crewId).order("joined_at",{ascending:true}):{data:[] as any[]};
 const memberIds=Array.from(new Set((members||[]).map((x:any)=>x.user_id)));const {data:memberProfiles}=memberIds.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",memberIds):{data:[] as any[]};const memberNames=new Map((memberProfiles||[]).map((p:any)=>[p.user_id,p.display_name]));

 const {data:logs}=crewId?await sb.from("runart_course_logs").select("id,run_date,actual_distance_km,course_id,runart_courses(name,distance_km)").eq("crew_id",crewId).order("run_date",{ascending:false}):{data:[] as any[]};
 const logIds=(logs||[]).map((l:any)=>l.id);
 const {data:participants}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};
 const logMap=new Map((logs||[]).map((l:any)=>[l.id,l]));
 const stats=new Map<string,{count:number;km:number;last:string|null;courses:Set<string>}>();
 for(const id of memberIds)stats.set(id,{count:0,km:0,last:null,courses:new Set()});
 for(const p of (participants||[]) as any[]){
   const l:any=logMap.get(p.log_id);if(!l)continue;
   const s=stats.get(p.user_id)||{count:0,km:0,last:null,courses:new Set<string>()};
   s.count+=1;s.km+=Number(l.actual_distance_km||l.runart_courses?.distance_km||0);s.courses.add(l.course_id);
   if(!s.last||l.run_date>s.last)s.last=l.run_date;stats.set(p.user_id,s);
 }
 const totalRuns=(logs||[]).length;
 const totalAttendances=(participants||[]).length;
 const avgAttendance=totalRuns?totalAttendances/totalRuns:0;

 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">대시보드</Link><Link className="btn ghost" href="/">지도</Link><Link className="btn ghost" href="/art">그리기 런</Link><LogoutButton/></div></header>
 <section className="hero compact"><h1>크루 운영 센터</h1><p className="muted">가입 승인부터 실제 러닝 출석·누적 기록까지 관리합니다.</p></section>
 <div className="stats"><div className="stat"><b>{(members||[]).length}</b><span className="muted">크루원</span></div><div className="stat"><b>{totalRuns}</b><span className="muted">기록된 러닝</span></div><div className="stat"><b>{totalAttendances}</b><span className="muted">누적 참여</span></div><div className="stat"><b>{avgAttendance.toFixed(1)}</b><span className="muted">평균 참여 인원</span></div></div>

 <section className="section"><h2>크루원 참여 현황</h2><div className="grid">{(members||[]).map((m:any)=>{const s=stats.get(m.user_id)||{count:0,km:0,last:null,courses:new Set()};const rate=totalRuns?Math.round((s.count/totalRuns)*100):0;return <div className="card memberStatCard" key={m.user_id}><div className="memberStatTop"><div><h3>{memberNames.get(m.user_id)||"러너"}</h3><span className="tag">{m.role}</span></div><b>{rate}%</b></div><div className="miniStats"><span><b>{s.count}</b>참여</span><span><b>{s.km.toFixed(1)}</b>km</span><span><b>{s.courses.size}</b>코스</span></div><p className="muted">최근 참여: {s.last||"아직 없음"}</p></div>})}</div></section>

 <section className="section"><h2>최근 러닝 출석</h2><div className="card">{(logs||[]).slice(0,15).map((l:any)=>{const ps=(participants||[]).filter((p:any)=>p.log_id===l.id);return <div className="course" key={l.id}><b>{l.run_date} · {l.runart_courses?.name}</b><p className="muted">👥 {ps.length}명 · {ps.map((p:any)=>memberNames.get(p.user_id)||"러너").join(", ")||"참여자 미등록"}</p></div>})}{!(logs||[]).length&&<p className="muted">아직 수행 기록이 없습니다.</p>}</div></section>

 <section className="section"><h2>크루 가입 신청</h2>{(joinReqs||[]).length?(joinReqs||[]).map((x:any)=><article className="card moderationCard" key={x.id}><div><h3>{names.get(x.user_id)||"신규 러너"}</h3><p className="muted">{x.message||"가입 메시지 없음"}</p><small className="muted">{new Date(x.created_at).toLocaleString("ko-KR")}</small></div><JoinRequestActions requestId={x.id}/></article>):<div className="card muted">대기 중인 가입 신청이 없습니다.</div>}</section>

 <section className="section"><h2>승인 대기 코스</h2>{(pending||[]).length?(pending||[]).map((x:any)=><article className="card moderationCard" key={x.id}><div><h3>{x.name}</h3><p className="muted">{x.region} {x.city} · {Number(x.distance_km).toFixed(1)}km · {x.course_type}{x.art_shape?` · ${x.art_shape}`:""}</p><span className="tag">pending</span></div><ModerationButtons courseId={x.id}/></article>):<div className="card muted">승인 대기 코스가 없습니다.</div>}</section>
 <section className="section"><h2>전국 코스 DB 확장</h2><BulkCourseImport/></section></main>
}
