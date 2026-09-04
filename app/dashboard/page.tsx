import Link from "next/link";
import {redirect} from "next/navigation";
import HubIcon from "@/components/HubIcon";
import {createClient} from "@/lib/supabase/server";

type CrewIcon="addRun"|"activity"|"completed"|"crewRace"|"manage"|"course"|"gps";
function CrewCard({href,icon,label,title,description,primary=false}:{href:string;icon:CrewIcon;label:string;title:string;description:string;primary?:boolean}){
 return <Link className={`hubTile crewHubTile${primary?" primaryHubTile":""}`} href={href}>
  <HubIcon name={icon}/>
  <div className="hubTileCopy"><small>{label}</small><h2>{title}</h2><p>{description}</p></div>
  <b className="hubTileChevron">›</b>
 </Link>;
}

export default async function Dashboard(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const [ownedResult,membershipsResult]=await Promise.all([
  sb.from("runart_crews").select("id,name").eq("owner_id",user.id).maybeSingle(),
  sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id)
 ]);
 const owned=ownedResult.data,memberships=membershipsResult.data;
 const membership=memberships?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role||"member";if(!crewId)redirect("/join");const canManage=["owner","admin"].includes(role);
 const [memberRowsResult,logsResult]=await Promise.all([
  sb.from("runart_crew_members").select("user_id").eq("crew_id",crewId),
  sb.from("runart_course_logs").select("id,run_date,actual_distance_km,course_id,runart_courses(distance_km)").eq("crew_id",crewId).order("run_date",{ascending:false}).limit(150)
 ]);
 const memberRows=memberRowsResult.data,logs=logsResult.data;
 const memberIds=(memberRows||[]).map((m:any)=>m.user_id),logIds=(logs||[]).map((l:any)=>l.id);
 const [profilesResult,partsResult]=await Promise.all([
  memberIds.length?sb.from("runart_profiles").select("user_id,display_name").in("user_id",memberIds):Promise.resolve({data:[] as any[]}),
  logIds.length?sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):Promise.resolve({data:[] as any[]})
 ]);
 const profiles=profilesResult.data,parts=partsResult.data;
 const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));const myName=names.get(user.id)||user.email?.split("@")[0]||"러너";
 const myLogIds=new Set((parts||[]).filter((p:any)=>p.user_id===user.id).map((p:any)=>p.log_id));const myLogs=(logs||[]).filter((l:any)=>myLogIds.has(l.id)),myKm=myLogs.reduce((s:number,l:any)=>s+Number(l.actual_distance_km||l.runart_courses?.distance_km||0),0),myDone=new Set(myLogs.map((l:any)=>l.course_id));
 return <main className="wrap hubPage crewHubPage">
  <section className="compactPageHero"><span className="eyebrow">CREW</span><h1>{owned?.name||"러닝 크루"}</h1><p className="muted">{myName} · {role} · 크루원 {(memberRows||[]).length}명</p></section>
  <section className="myHubSummary"><div><small>내 참여</small><b>{myLogs.length}<em>회</em></b></div><div><small>완주 코스</small><b>{myDone.size}<em>개</em></b></div><div><small>내 거리</small><b>{myKm.toFixed(1)}<em>km</em></b></div><div><small>크루 기록</small><b>{(logs||[]).length}<em>회</em></b></div></section>
  <section className="pageHubGrid crewHubGrid">
   <CrewCard href="/dashboard/add" icon="addRun" label="ADD RUN" title="기록 추가" description="참가자와 실제 거리 입력" primary/>
   <CrewCard href="/dashboard/activity" icon="activity" label="ACTIVITY" title="최근 러닝" description="크루 활동·참여 현황"/>
   <CrewCard href="/dashboard/completed" icon="completed" label="COMPLETED" title="완주 코스" description="내가 참여한 크루런 코스"/>
   <CrewCard href="/races/crew" icon="crewRace" label="CREW RACE" title="크루 대회" description="멤버 참가 일정·현황"/>
   {canManage&&<CrewCard href="/manage" icon="manage" label="ADMIN" title="크루 관리" description="멤버·신청·코스 승인"/>}
   <CrewCard href="/explore" icon="course" label="COURSE" title="코스 찾기" description="다음 크루런 코스 탐색"/>
   <CrewCard href="/my/history" icon="gps" label="MY RUN" title="내 GPS 기록" description="개인 러닝 히스토리"/>
  </section>
 </main>;
}
