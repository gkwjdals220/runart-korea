import { cache } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const getHomeUser = cache(async () => {
  const sb = await createClient();
  const { data: { session } } = await sb.auth.getSession();
  return session?.user ?? null;
});

function raceDday(date: string) {
  const target = new Date(`${date}T00:00:00+09:00`).getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - now.getTime()) / 86400000);
  return days === 0 ? "D-DAY" : days > 0 ? `D-${days}` : "종료";
}

export async function HomeAccountLink() {
  const user = await getHomeUser();
  return <Link className="btn" href={user ? "/my" : "/login"} prefetch>{user ? "MY" : "로그인"}</Link>;
}

export function HomeAccountFallback() {
  return <span className="btn homeAccountFallback" aria-hidden="true">MY</span>;
}

export function HomePersonalizedFallback() {
  return <section className="homeActionSection compactHomeSection" aria-label="개인화 메뉴 불러오는 중"><div className="homeSectionTitle"><div><small>FOR YOU</small><h2>바로 이어서</h2></div></div><div className="homeDirectList homeDirectSkeleton" aria-hidden="true">{[0, 1, 2].map((item) => <span key={item} />)}</div></section>;
}

export default async function HomePersonalized() {
  const user = await getHomeUser();
  let favoriteCount = 0;
  let nextRace: { race_date: string; race_name: string } | null = null;
  if (user) {
    const sb = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const [favoriteResult, racesResult] = await Promise.all([
      sb.from("runart_favorites").select("course_id", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("runart_public_race_participation").select("race_name,race_date").eq("user_id", user.id).in("status", ["applied", "going"]).gte("race_date", today).order("race_date", { ascending: true }).limit(1),
    ]);
    favoriteCount = favoriteResult.count ?? 0;
    nextRace = racesResult.data?.[0] ?? null;
  }
  return <section className="homeActionSection compactHomeSection"><div className="homeSectionTitle"><div><small>FOR YOU</small><h2>자주 찾는 메뉴</h2></div></div><div className="homeDirectList"><Link href="/favorites" prefetch><span>♡</span><div><b>저장함</b><small>{user ? `찜한 코스 ${favoriteCount}개 · 장소 · 일정` : "코스 · 장소 · 일정을 한곳에 저장"}</small></div><em>›</em></Link>{user ? <Link href="/races/my" prefetch><span>🏁</span><div><b>내 대회 일정</b><small>{nextRace ? `${raceDday(nextRace.race_date)} · ${nextRace.race_name}` : "저장한 참가 일정을 확인"}</small></div><em>›</em></Link> : null}<Link href="/run/track" prefetch><span>🏟</span><div><b>트랙런</b><small>400m 자동랩 · 인터벌</small></div><em>›</em></Link><Link href="/dashboard/activity" prefetch><span>◉</span><div><b>크루 최근 활동</b><small>최근 러닝과 참여 현황</small></div><em>›</em></Link></div></section>;
}
