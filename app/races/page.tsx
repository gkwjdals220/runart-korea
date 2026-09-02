import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import LogoutButton from "@/components/LogoutButton";
import RaceManager from "@/components/RaceManager";
import {createClient} from "@/lib/supabase/server";

export default async function RacesPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id,name").eq("owner_id",user.id).maybeSingle();
 const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=mem?.[0];const crewId=owned?.id||membership?.crew_id;const role=owned?"owner":membership?.role||"member";if(!crewId)redirect("/join");
 const {data:races}=await sb.from("runart_races").select("id,name,race_date,region,venue,registration_deadline,registration_status,distance_options,official_url,memo").eq("crew_id",crewId).order("race_date",{ascending:true,nullsFirst:false});
 const raceIds=(races||[]).map((r:any)=>r.id);
 const {data:parts}=raceIds.length?await sb.from("runart_race_participation").select("race_id,user_id,status,distance,note").in("race_id",raceIds):{data:[] as any[]};
 const {data:legacy}=raceIds.length?await sb.from("runart_race_legacy_participation").select("race_id,member_name,status,distance,applied,note,linked_user_id").in("race_id",raceIds):{data:[] as any[]};
 const {data:memberRows}=await sb.from("runart_crew_members").select("user_id,role").eq("crew_id",crewId);
 const ids=(memberRows||[]).map((m:any)=>m.user_id);const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const members=(memberRows||[]).map((m:any)=>({...m,display_name:names.get(m.user_id)||"러너"}));
 return <main className="wrap racePage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">크루 홈</Link><Link className="btn ghost" href="/manage">운영</Link><LogoutButton/></div></header><section className="compactPageHero"><span className="eyebrow">TTWITTUN RACE</span><h1>대회 참여</h1><p className="muted">대회 일정과 참가 현황만 빠르게 확인하고 관리합니다.</p></section><RaceManager userId={user.id} crewId={crewId} role={role} races={(races||[]) as any} participations={(parts||[]) as any} legacyParticipations={(legacy||[]) as any} members={members as any}/></main>
}
