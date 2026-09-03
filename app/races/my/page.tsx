import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import PublicRaceBrowser from "@/components/PublicRaceBrowser";
import {createClient} from "@/lib/supabase/server";

export default async function MyRacesPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:saved}=await sb.from("runart_public_race_participation").select("source_key,race_name,race_date,region,official_url,status,distance,note").eq("user_id",user.id).order("race_date",{ascending:true,nullsFirst:false});
 return <main className="wrap racePage liveRacePage myRacePage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/races">전체 대회</Link><Link className="btn ghost" href="/my">MY</Link></div></header><section className="compactPageHero raceLiveHero raceCalendarHero"><span className="eyebrow">MY RACE CALENDAR</span><h1>내 대회 일정</h1><p className="muted">관심·신청완료·참가예정으로 저장한 대회만 모아서 확인합니다.</p></section><PublicRaceBrowser userId={user.id} initialSaved={(saved||[]) as any} initialMineOnly/></main>
}
