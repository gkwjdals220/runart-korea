import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import JoinCrewForm from "@/components/JoinCrewForm";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Join(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:crew}=await sb.from("runart_crews").select("id,name,slug").eq("slug","ttunttun").maybeSingle();
 if(!crew)return <main className="wrap"><div className="card">뛰뚠뛰뚠 크루를 찾을 수 없습니다.</div></main>;
 const {data:member}=await sb.from("runart_crew_members").select("role").eq("crew_id",crew.id).eq("user_id",user.id).maybeSingle();
 if(member)redirect("/dashboard");
 const {data:req}=await sb.from("runart_crew_join_requests").select("status").eq("crew_id",crew.id).eq("user_id",user.id).maybeSingle();
 return <main className="wrap authJoinPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/">홈</Link><LogoutButton/></div></header>
  <section className="compactPageHero"><span className="eyebrow">JOIN CREW</span><h1>뛰뚠뛰뚠 크루 가입</h1><p className="muted">신청 후 승인되면 크루 기록과 대회 관리 기능을 사용할 수 있어요.</p></section>
  <div style={{maxWidth:620}}><JoinCrewForm userId={user.id} crewId={crew.id} initialStatus={req?.status||null}/></div>
 </main>;
}
