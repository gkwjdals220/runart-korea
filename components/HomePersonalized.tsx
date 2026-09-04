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

function SimpleIcon({ name }: { name: "saved" | "calendar" | "track" | "crew" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    {name === "saved" && <path {...common} d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />}
    {name === "calendar" && <><rect {...common} x="3" y="5" width="18" height="16" rx="2.5"/><path {...common} d="M7 3v4M17 3v4M3 10h18"/><path {...common} d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>}
    {name === "track" && <><rect {...common} x="3" y="5" width="18" height="14" rx="7"/><rect {...common} x="6" y="8" width="12" height="8" rx="4"/><rect {...common} x="9" y="10" width="6" height="4" rx="2"/></>}
    {name === "crew" && <><path {...common} d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle {...common} cx="9.5" cy="7" r="4"/><path {...common} d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
  </svg>;
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
  return <section className="homeActionSection compactHomeSection"><div className="homeSectionTitle"><div><small>FOR YOU</small><h2>자주 찾는 메뉴</h2></div></div><div className="homeDirectList"><Link href="/favorites" prefetch><span className="homeSimpleIcon"><SimpleIcon name="saved"/></span><div><b>저장함</b><small>{user ? `찜한 코스 ${favoriteCount}개 · 장소 · 일정` : "코스 · 장소 · 일정을 한곳에 저장"}</small></div><em>›</em></Link>{user ? <Link href="/races/my" prefetch><span className="homeSimpleIcon"><SimpleIcon name="calendar"/></span><div><b>내 대회 일정</b><small>{nextRace ? `${raceDday(nextRace.race_date)} · ${nextRace.race_name}` : "저장한 참가 일정을 확인"}</small></div><em>›</em></Link> : null}<Link href="/run/track" prefetch><span className="homeSimpleIcon"><SimpleIcon name="track"/></span><div><b>트랙런</b><small>400m 자동랩 · 인터벌</small></div><em>›</em></Link><Link href="/dashboard/activity" prefetch><span className="homeSimpleIcon"><SimpleIcon name="crew"/></span><div><b>크루 최근 활동</b><small>최근 러닝과 참여 현황</small></div><em>›</em></Link></div></section>;
}
