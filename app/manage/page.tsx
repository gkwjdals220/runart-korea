import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import HubIcon from "@/components/HubIcon";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Manage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");

 const {data:owned}=await sb.from("runart_crews").select("id,name").eq("owner_id",user.id).maybeSingle();
 const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=mem?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role;
 if(!crewId||!["owner","admin"].includes(role||""))redirect("/dashboard");

 const [{count:memberCount},{count:reqCount},{count:pendingCount},{count:runCount}]=await Promise.all([
  sb.from("runart_crew_members").select("user_id",{count:"exact",head:true}).eq("crew_id",crewId),
  sb.from("runart_crew_join_requests").select("id",{count:"exact",head:true}).eq("crew_id",crewId).eq("status","pending"),
  sb.from("runart_courses").select("id",{count:"exact",head:true}).eq("status","pending"),
  sb.from("runart_course_logs").select("id",{count:"exact",head:true}).eq("crew_id",crewId)
 ]);

 const tiles=[
  {href:"/manage/members",icon:"crew" as const,kicker:"MEMBERS",title:"크루원 관리",desc:"크루원 현황과 참여 기록을 관리합니다.",count:memberCount||0},
  {href:"/manage/requests",icon:"completed" as const,kicker:"REQUESTS",title:"가입 신청",desc:"가입 대기 요청을 확인하고 승인합니다.",count:reqCount||0},
  {href:"/manage/courses",icon:"course" as const,kicker:"COURSES",title:"코스 관리",desc:"제보된 코스와 승인 대기 항목을 관리합니다.",count:pendingCount||0},
  {href:"/races",icon:"crewRace" as const,kicker:"RACES",title:"대회 관리",desc:"크루 대회 일정과 참가 현황을 확인합니다.",count:null},
  {href:"/dashboard#recent-crew",icon:"activity" as const,kicker:"RUN LOGS",title:"러닝 기록",desc:"최근 출석과 크루 활동 기록을 확인합니다.",count:runCount||0},
 ];

 return <main className="wrap hubPage manageHubPage">
  <header className="top compactPageTop">
   <Brand/>
   <div className="nav"><Link className="btn ghost" href="/dashboard">크루 홈</Link><LogoutButton/></div>
  </header>

  <section className="compactPageHero manageHubHero">
   <div className="manageHeroSymbol"><HubIcon name="manage"/></div>
   <div><span className="eyebrow">CREW ADMIN</span><h1>{owned?.name||"크루"} 운영센터</h1><p className="muted">크루 운영에 필요한 메뉴를 한곳에서 빠르게 관리합니다.</p></div>
  </section>

  <section className="pageHubGrid manageHubGrid">
   {tiles.map(tile=><Link href={tile.href} className="hubTile manageHubTile" key={tile.href}>
    <HubIcon name={tile.icon}/>
    <div className="manageHubTileText"><small>{tile.kicker}</small><h2>{tile.title}</h2><p>{tile.desc}</p></div>
    <div className="manageHubTileMeta">{tile.count!==null&&<strong>{tile.count}</strong>}<b aria-hidden="true">›</b></div>
   </Link>)}
  </section>
 </main>;
}
