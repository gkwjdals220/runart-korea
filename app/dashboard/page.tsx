import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import RunLogForm from "@/components/RunLogForm";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Dashboard(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");

 const {data:courses}=await sb.from("runart_courses")
  .select("id,name,distance_km,course_type,art_shape,region,city")
  .eq("status","approved").order("name");
 const {data:ownedCrew}=await sb.from("runart_crews").select("id,name,slug").eq("owner_id",user.id).maybeSingle();
 const {data:memberships}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=memberships?.[0];
 const crewId=ownedCrew?.id||membership?.crew_id;
 const role=ownedCrew?"owner":membership?.role||"member";
 if(!crewId)redirect("/join");

 const {data:memberRows}=await sb.from("runart_crew_members").select("user_id,role").eq("crew_id",crewId);
 const memberIds=(memberRows||[]).map((m:any)=>m.user_id);
 const {data:profiles}=memberIds.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",memberIds):{data:[] as any[]};
 const nameMap=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,role:m.role,display_name:nameMap.get(m.user_id)||"러너"}));

 const {data:logsData}=await sb.from("runart_course_logs")
  .select("id,run_date,actual_distance_km,memo,photo_path,course_id,runart_courses(name,distance_km)")
  .eq("crew_id",crewId).order("run_date",{ascending:false}).limit(100);
 const logs=logsData||[];
 const logIds=logs.map((l:any)=>l.id);
 const {data:participants}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};
 const participantCount=new Map<string,number>();
 (participants||[]).forEach((p:any)=>participantCount.set(p.log_id,(participantCount.get(p.log_id)||0)+1));
 const myLogIds=new Set((participants||[]).filter((p:any)=>p.user_id===user.id).map((p:any)=>p.log_id));
 const myLogs=logs.filter((l:any)=>myLogIds.has(l.id));
 const myDone=new Set(myLogs.map((l:any)=>l.course_id));
 const myKm=myLogs.reduce((a:number,l:any)=>a+Number(l.actual_distance_km||l.runart_courses?.distance_km||0),0);
 const crewKm=logs.reduce((a:number,l:any)=>a+Number(l.actual_distance_km||l.runart_courses?.distance_km||0)*(participantCount.get(l.id)||0),0);

 return <main className="wrap">
  <header className="top"><Brand/><div className="nav">
   <Link className="btn ghost" href="/">코스 찾기</Link>
   <Link className="btn ghost" href="/submit">코스 제보</Link>
   {["owner","admin"].includes(role)&&<Link className="btn" href="/manage">크루 관리</Link>}
   <LogoutButton/>
  </div></header>

  <div className="card" style={{marginBottom:14}}><b>{ownedCrew?.name||"뛰뚠뛰뚠"}</b><span className="muted"> · 현재 권한: {role} · 크루원 {members.length}명</span></div>

  <section className="section"><h2>내 참여 기록</h2>
   <div className="stats">
    <div className="stat"><b>{myLogs.length}</b><span className="muted">참여 러닝</span></div>
    <div className="stat"><b>{myDone.size}</b><span className="muted">완주 코스</span></div>
    <div className="stat"><b>{myKm.toFixed(1)}</b><span className="muted">누적 km</span></div>
    <div className="stat"><b>{(courses||[]).filter(c=>c.course_type==="art"&&myDone.has(c.id)).length}</b><span className="muted">GPS 아트</span></div>
   </div>
  </section>

  <section className="section"><div className="grid2">
   <RunLogForm userId={user.id} crewId={crewId} role={role} members={members} courses={(courses||[]).map(c=>({id:c.id,name:c.name,distance_km:Number(c.distance_km)}))}/>
   <div className="card"><h3>최근 크루 러닝</h3><p className="muted">총 {logs.length}회 · 참여거리 합계 {crewKm.toFixed(1)}km</p>
    {logs.length?logs.slice(0,12).map((l:any)=><div className="course" key={l.id}>
     <b>{l.run_date} · {l.runart_courses?.name}</b>
     <p className="muted">{l.actual_distance_km||l.runart_courses?.distance_km}km · 👥 {participantCount.get(l.id)||0}명 · {l.memo||"메모 없음"}</p>
    </div>):<p className="muted">아직 온라인 기록이 없습니다.</p>}
   </div>
  </div></section>

  <section className="section"><h2>내 완주 현황</h2><div className="grid">
   {(courses||[]).map(c=><div className="card" key={c.id}><h3>{c.name} {myDone.has(c.id)&&<span className="done">✓</span>}</h3><p className="muted">{c.region} {c.city} · {c.distance_km}km</p>{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape}</span>}</div>)}
  </div></section>
 </main>
}
