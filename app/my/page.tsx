import Link from "next/link";
import Brand from "@/components/Brand";
import MyLogoutButton from "@/components/MyLogoutButton";
import { createClient } from "@/lib/supabase/server";

function pace(sec?: number | null) {
  return sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "--:--";
}

function HubCard({href,icon,label,title,description}:{href:string;icon:string;label:string;title:string;description:string}){
  return <Link className="hubTile myHubTile" href={href}>
    <span className="hubTileIcon" aria-hidden="true">{icon}</span>
    <div className="hubTileCopy">
      <small>{label}</small>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <b className="hubTileChevron">›</b>
  </Link>;
}

export default async function MyPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main className="wrap authJoinPage">
    <header className="top"><Brand /></header>
    <section className="hero compact"><div>
      <span className="eyebrow">MY TTWITTUN</span><h1>MY</h1>
      <p className="muted">로그인하면 러닝 기록과 저장한 코스를 관리할 수 있어요.</p>
      <div className="actions" style={{ marginTop: 18 }}><Link className="btn" href="/login">로그인</Link></div>
    </div></section>
  </main>;

  const [{ data: profile },{ count: favCount },{ count: raceCount },{ data: rowsData }] = await Promise.all([
    sb.from("runart_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    sb.from("runart_favorites").select("course_id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("runart_public_race_participation").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("runart_live_runs").select("distance_km,avg_pace_sec_per_km,finished_at").eq("user_id", user.id).order("finished_at", { ascending: false }).limit(300),
  ]);
  const rows = rowsData || [], now = Date.now(), weekAgo = now - 7 * 86400000, monthAgo = now - 30 * 86400000;
  const week = rows.filter((r:any)=>new Date(r.finished_at).getTime() >= weekAgo), month = rows.filter((r:any)=>new Date(r.finished_at).getTime() >= monthAgo);
  const weekKm = week.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0), monthKm = month.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0), totalKm = rows.reduce((s:number,r:any)=>s+Number(r.distance_km||0),0);
  const paces = rows.map((r:any)=>Number(r.avg_pace_sec_per_km||0)).filter((v:number)=>v>0), avgPace = paces.length ? Math.round(paces.reduce((a:number,b:number)=>a+b,0)/paces.length) : null;

  return <main className="wrap hubPage myHubPage">
    <section className="compactPageHero">
      <span className="eyebrow">MY TTWITTUN</span><h1>{profile?.display_name || "러너"}님</h1>
      <p className="muted">내 기록과 저장함을 필요한 화면으로 바로 이동해 확인하세요.</p>
    </section>
    <section className="myHubSummary">
      <div><small>이번 주</small><b>{weekKm.toFixed(1)}<em>km · {week.length}회</em></b></div>
      <div><small>최근 30일</small><b>{monthKm.toFixed(1)}<em>km · {month.length}회</em></b></div>
      <div><small>누적</small><b>{totalKm.toFixed(1)}<em>km</em></b></div>
      <div><small>평균 페이스</small><b>{pace(avgPace)}<em>/km</em></b></div>
    </section>
    <section className="pageHubGrid">
      <HubCard href="/my/history" icon="◷" label="HISTORY" title="러닝 기록" description="최근 러닝과 상세 기록" />
      <HubCard href="/my/pb" icon="★" label="PERSONAL BEST" title="내 PB" description="1K·3K·5K·10K·트랙" />
      <HubCard href="/my/shoes" icon="◇" label="SHOE MILEAGE" title="내 러닝화" description="신발별 누적 거리·교체 시점" />
      <HubCard href="/shoes" icon="↗" label="SHOE GUIDE" title="러닝화 추천" description="용도별 랭킹·드롭·판매 일정" />
      <HubCard href="/run/treadmill" icon="≡" label="TREADMILL" title="트레드밀 계산기" description="목표 페이스를 속도로 변환" />
      <HubCard href="/favorites" icon="♡" label="SAVED" title="저장함" description={`찜한 코스 ${favCount || 0}개 · 장소 · 일정`} />
      <HubCard href="/races/my" icon="▱" label="MY RACE" title="내 대회 일정" description={`저장한 대회 ${raceCount || 0}개 · 참가 상태`} />
      <HubCard href="/races" icon="⌕" label="RACE FINDER" title="대회 찾기" description="전국 일정·Google Form 접수" />
      <HubCard href="/dashboard" icon="◎" label="CREW" title="크루" description="활동·출석·대회 관리" />
      <HubCard href="/my/profile" icon="○" label="PROFILE" title="프로필" description="표시 이름 관리" />
      <HubCard href="/my/account" icon="□" label="ACCOUNT" title="계정 관리" description="개인정보·계정 삭제 요청" />
    </section>
    <div className="pageBottomActions myPageBottomActions">
      <Link className="btn ghost myUtilityButton" href="/privacy">개인정보 처리방침</Link>
      <Link className="btn ghost myUtilityButton" href="/support">고객지원</Link>
      <MyLogoutButton />
    </div>
  </main>;
}
