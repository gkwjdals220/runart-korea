import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import RunLogForm from "@/components/RunLogForm";
import {createClient} from "@/lib/supabase/server";

export default async function CrewAddPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();const {data:memberships}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);const membership=memberships?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role||"member";if(!crewId)redirect("/join");
 const {data:memberRows}=await sb.from("runart_crew_members").select("user_id,role").eq("crew_id",crewId);const memberIds=(memberRows||[]).map((m:any)=>m.user_id);const {data:profiles}=memberIds.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",memberIds):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));const members=(memberRows||[]).map((m:any)=>({...m,display_name:names.get(m.user_id)||"러너"}));
 const {data:courses}=await sb.from("runart_courses").select("id,name,distance_km").eq("status","approved").order("name");
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">← 크루</Link></div></header><section className="compactPageHero"><span className="eyebrow">ADD RUN</span><h1>러닝 기록 추가</h1><p className="muted">참가자와 실제 거리를 한 화면에서 기록합니다.</p></section><section className="section"><RunLogForm userId={user.id} crewId={crewId} role={role} members={members as any} courses={(courses||[]).map(c=>({id:c.id,name:c.name,distance_km:Number(c.distance_km)}))}/></section></main>
}
