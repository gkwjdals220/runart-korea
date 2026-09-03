import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import ProfileEditor from "@/components/ProfileEditor";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function MyProfilePage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:profile}=await sb.from("runart_profiles").select("display_name").eq("user_id",user.id).maybeSingle();
 const displayName=profile?.display_name||user.email?.split("@")[0]||"러너";
 return <main className="wrap mobileSubPage profilePage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/my">← MY</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">PROFILE</span><h1>프로필</h1><p className="muted">러닝 기록과 크루에서 사용할 이름을 관리합니다.</p></section>
  <section className="section profileEditorWrap"><ProfileEditor userId={user.id} initialName={displayName}/></section>
  <div className="pageBottomActions profileSessionActions"><LogoutButton/></div>
 </main>;
}
