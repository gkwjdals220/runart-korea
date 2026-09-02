import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import RaceSubmissionForm from "@/components/RaceSubmissionForm";
import {createClient} from "@/lib/supabase/server";

export default async function RaceSubmitPage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 return <main className="wrap racePage raceSubmitPage"><header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/races">← 대회 일정</Link></div></header><section className="compactPageHero"><span className="eyebrow">RACE TIP</span><h1>빠진 대회 알려주기</h1><p className="muted">구글폼·인스타 공지·소규모 러닝처럼 검색에서 빠질 수 있는 대회 링크를 보내주세요.</p></section><RaceSubmissionForm userId={user.id}/><p className="raceSourceNote">제보 링크는 일정 확인 목적으로만 사용하며, 참가 신청은 각 주최 측 페이지에서 직접 진행합니다.</p></main>
}
