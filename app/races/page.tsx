import Link from "next/link";
import Brand from "@/components/Brand";
import PublicRaceBrowser from "@/components/PublicRaceBrowser";
import {createClient} from "@/lib/supabase/server";

export default async function RacesPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();
 const {data:saved}=user?await sb.from("runart_public_race_participation").select("source_key,race_name,race_date,region,official_url,status,distance,note").eq("user_id",user.id).order("race_date",{ascending:true,nullsFirst:false}):{data:[] as any[]};
 let hasCrew=false;if(user){const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();const {data:mem}=await sb.from("runart_crew_members").select("crew_id").eq("user_id",user.id).limit(1);hasCrew=!!owned||!!mem?.length}
 return <main className="wrap racePage liveRacePage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href={user?"/my":"/login"}>{user?"← MY":"로그인"}</Link></div></header><section className="compactPageHero raceLiveHero raceCalendarHero"><span className="eyebrow">RACE CALENDAR</span><h1>지금 신청할 러닝 대회</h1><p className="muted">다가오는 국내 러닝·마라톤 대회와 공개 Google Form 접수를 함께 찾아보고 관심·신청·참가 여부를 내 기록으로 남겨두세요.</p></section>{user&&<nav className="racePageActions" aria-label="대회 보조 메뉴"><Link href="/races/submit">＋ 빠진 대회 제보</Link>{hasCrew&&<Link href="/races/crew">크루 대회 관리</Link>}<Link href="/races/my">★ 내 대회 일정</Link></nav>}<PublicRaceBrowser userId={user?.id||null} initialSaved={(saved||[]) as any}/></main>
}
