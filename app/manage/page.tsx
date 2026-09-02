import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Manage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id,name").eq("owner_id",user.id).maybeSingle();const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);const membership=mem?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role;if(!crewId||!["owner","admin"].includes(role||""))redirect("/dashboard");
 const [{count:memberCount},{count:reqCount},{count:pendingCount},{count:runCount}]=await Promise.all([
  sb.from("runart_crew_members").select("user_id",{count:"exact",head:true}).eq("crew_id",crewId),
  sb.from("runart_crew_join_requests").select("id",{count:"exact",head:true}).eq("crew_id",crewId).eq("status","pending"),
  sb.from("runart_courses").select("id",{count:"exact",head:true}).eq("status","pending"),
  sb.from("runart_course_logs").select("id",{count:"exact",head:true}).eq("crew_id",crewId)
 ]);
 return <main className="wrap hubPage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">크루 홈</Link><LogoutButton/></div></header><section className="compactPageHero"><span className="eyebrow">CREW ADMIN</span><h1>{owned?.name||"크루"} 운영센터</h1><p className="muted">한 화면에 모든 관리 기능을 쌓지 않고 필요한 작업 페이지로 바로 이동합니다.</p></section><section className="pageHubGrid"><Link href="/manage/members" className="hubTile"><span>👥</span><div><small>MEMBERS</small><h2>크루원</h2><p>참여·누적 거리</p></div><b>{memberCount||0} ›</b></Link><Link href="/manage/requests" className="hubTile"><span>✓</span><div><small>REQUESTS</small><h2>가입 신청</h2><p>승인 대기 처리</p></div><b>{reqCount||0} ›</b></Link><Link href="/manage/courses" className="hubTile"><span>📍</span><div><small>COURSES</small><h2>코스 승인</h2><p>제보·DB 관리</p></div><b>{pendingCount||0} ›</b></Link><Link href="/races" className="hubTile"><span>🏁</span><div><small>RACES</small><h2>대회 관리</h2><p>일정·참가 현황</p></div><b>›</b></Link><Link href="/dashboard#recent-crew" className="hubTile"><span>👟</span><div><small>RUN LOGS</small><h2>러닝 기록</h2><p>최근 출석·활동</p></div><b>{runCount||0} ›</b></Link></section></main>;
}
