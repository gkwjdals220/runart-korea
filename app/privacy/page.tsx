import Link from "next/link";
import Brand from "@/components/Brand";

export default function PrivacyPage(){
 return <main className="wrap hubPage legalPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/">홈</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">PRIVACY</span><h1>개인정보 처리방침</h1><p className="muted">시행일 2026-09-02 · TTWITTUN</p></section>
  <section className="legalCard">
   <h2>1. 수집하는 정보</h2><p>TTWITTUN은 회원가입 및 서비스 제공 과정에서 이메일, 프로필 정보, 러닝 기록, 사용자가 저장한 대회 참가 정보 등을 처리할 수 있습니다. GPS 러닝 기능을 사용하는 경우 사용자가 러닝을 시작한 동안 위치 좌표와 이동 경로가 기록될 수 있습니다.</p>
   <h2>2. 이용 목적</h2><p>수집된 정보는 로그인, 개인 러닝 기록 저장, 코스 탐색, 크루 기능, 대회 참가 일정 관리, 서비스 품질 개선을 위해 사용됩니다.</p>
   <h2>3. 위치 정보</h2><p>위치 정보는 사용자가 러닝 기록 또는 주변 코스·시설 기능을 직접 사용하는 경우에만 요청합니다. 현재 앱은 사용자가 시작한 러닝을 기록하기 위한 전경 위치 권한을 기준으로 동작합니다.</p>
   <h2>4. 보관 및 삭제</h2><p>서비스 운영에 필요한 기간 동안 정보를 보관하며, 계정 및 관련 정보 삭제 요청이 접수되면 법령상 보관 의무가 있는 경우를 제외하고 필요한 절차에 따라 삭제합니다.</p>
   <h2>5. 외부 서비스</h2><p>서비스는 인증 및 데이터 저장을 위해 Supabase, 웹 서비스 제공을 위해 Vercel 등 외부 인프라를 사용할 수 있습니다. 대회 공식 신청 페이지나 외부 지도·웹사이트를 열 때에는 해당 서비스의 개인정보 정책이 적용됩니다.</p>
   <h2>6. 문의</h2><p>개인정보 관련 문의 및 삭제 요청은 <Link href="/support">고객지원 페이지</Link>를 통해 안내받을 수 있습니다.</p>
  </section>
 </main>
}
