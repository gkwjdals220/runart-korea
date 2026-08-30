import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import RunLogForm from "@/components/RunLogForm";
import ProfileEditor from "@/components/ProfileEditor";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Dashboard(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:courses}=await sb.from("runart_courses").select("id,name,distance_km,course_type,art_shape,region,city").eq("status","approved").order("name");
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
 const myName=nameMap.get(user.id)||user.email?.split("@")[0]||"러너";
 const {data:logsData}=await sb.from("runart_course_logs").select("id,run_date,actual_distance_km,memo,photo_path,course_id,created_by,runart_courses(name,distance_km)").eq("crew_id",crewId).order("run_date",{ascending:false}).limit(100);
 const logs=logsData||[];
 const logIds=logs.map((l:any)=>l.id);
 const {data:participants}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};
 const participantCount=new Map<string,number>();
 (participants||[]).forEach((p:any)=>participantCount.set(p.log_id,(participantCount.get(p.log_id)||0)+1));
 const myLogIds=new Set((participants||[]).filter((p:any)=>p.user_id===user.id).map((p:any)=>p.log_id));
 const myLogs=logs.filter((l:any)=>myLogIds.has(l.id));
 const myDone=new Set(myLogs.map((l:any)=>l.course_id));
 const completedCourses=(courses||[]).filter(c=>myDone.has(c.id));
 const myKm=myLogs.reduce((a:number,l:any)=>a+Number(l.actual_distance_km||l.runart_courses?.distance_km||0),0);
 const crewKm=logs.reduce((a:number,l:any)=>a+Number(l.actual_distance_km||l.runart_courses?.distance_km||0)*(participantCount.get(l.id)||0),0);
 const canManage=["owner","admin"].includes(role);
 return <main className="wrap dashboardPage">
  <header className="top dashboardTop"><Brand/><div className="nav"><Link className="btn ghost" href="/#explore">코스 찾기</Link><Link className="btn ghost" href="/races">대회</Link>{canManage&&<Link className="btn" href="/manage">크루 관리</Link>}<LogoutButton/></div></header>
  <section className="dashboardHero"><div><span className="eyebrow">CREW DASHBOARD</span><h1>{ownedCrew?.name||"러닝 크루"}</h1><p>{myName} · {role} · 크루원 {members.length}명</p></div><div className="actions"><a className="btn" href="#new-log">＋ 러닝 기록</a><Link className="btn ghost" href="/races">🏁 대회 일정</Link></div></section>
  <nav className="dashboardQuickNav" aria-label="크루 대시보드 빠른 이동"><a href="#summary">내 요약</a><a href="#new-log">기록 추가</a><a href="#recent-crew">최근 러닝</a><a href="#completed">완주 코스</a>{canManage&&<Link href="/manage">멤버 관리</Link>}</nav>
  <section className="dashboardSummary" id="summary"><div><small>내 참여 러닝</small><b>{myLogs.length}<em>회</em></b></div><div><small>완주 코스</small><b>{myDone.size}<em>개</em></b></div><div><small>내 누적 거리</small><b>{myKm.toFixed(1)}<em>km</em></b></div><div><small>크루 참여거리</small><b>{crewKm.toFixed(0)}<em>km</em></b></div></section>
  <section className="section dashboardUtility"><ProfileEditor userId={user.id} initialName={myName}/><div className="card"><span className="eyebrow">QUICK ACTIONS</span><h3>자주 쓰는 메뉴</h3><div className="dashboardActionGrid"><Link href="/submit">📍 코스 제보</Link><Link href="/races">🏁 대회 참여</Link><Link href="/my">👟 내 GPS 기록</Link>{canManage&&<Link href="/manage">⚙ 크루 관리</Link>}</div></div></section>
  <section className="section" id="new-log"><div className="sectionHead"><div><span className="eyebrow">ADD RUN</span><h2>러닝 기록 추가</h2><p className="muted">참가자와 실제 거리를 한 번에 기록하세요.</p></div></div><RunLogForm userId={user.id} crewId={crewId} role={role} members={members} courses={(courses||[]).map(c=>({id:c.id,name:c.name,distance_km:Number(c.distance_km)}))}/></section>
  <section className="section" id="recent-crew"><div className="sectionHead"><div><span className="eyebrow">RECENT CREW RUNS</span><h2>최근 크루 러닝</h2><p className="muted">최근 기록부터 빠르게 확인하고 수정할 수 있습니다.</p></div><Link className="textLink" href="/my">내 GPS 기록 →</Link></div><div className="crewRunList">{logs.length?logs.slice(0,10).map((l:any)=><article className="crewRunItem" key={l.id}><div><b>{l.runart_courses?.name||"러닝 기록"}</b><p>{l.run_date} · {l.actual_distance_km||l.runart_courses?.distance_km}km · 👥 {participantCount.get(l.id)||0}명</p>{l.memo&&<small>{l.memo}</small>}</div>{(canManage||l.created_by===user.id)?<Link className="btn ghost" href={`/logs/${l.id}`}>편집</Link>:<span className="tag">기록</span>}</article>):<div className="card emptyState"><b>아직 크루 러닝 기록이 없습니다.</b><p className="muted">첫 러닝 기록을 추가해보세요.</p><a className="btn" href="#new-log">기록 추가</a></div>}</div></section>
  <section className="section" id="completed"><div className="sectionHead"><div><span className="eyebrow">COMPLETED</span><h2>내 완주 코스</h2><p className="muted">완주한 코스만 모아서 보여드려요.</p></div><Link className="textLink" href="/#explore">새 코스 찾기 →</Link></div><div className="completedCourseGrid">{completedCourses.slice(0,12).map(c=><Link className="card" href={`/courses/${c.id}`} key={c.id}><span className="done">✓ 완주</span><h3>{c.name}</h3><p className="muted">{c.region} {c.city} · {c.distance_km}km</p>{c.course_type==="art"&&<span className="tag">🎨 {c.art_shape}</span>}</Link>)}{!completedCourses.length&&<div className="card emptyState"><b>아직 완주 코스가 없어요.</b><p className="muted">코스를 선택하고 첫 기록을 남겨보세요.</p><Link className="btn" href="/#explore">코스 찾기</Link></div>}</div></section>
 </main>
}
