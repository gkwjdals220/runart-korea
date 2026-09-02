import Link from "next/link";
import Brand from "@/components/Brand";

export default function SupportPage(){
 return <main className="wrap hubPage legalPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/">홈</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">SUPPORT</span><h1>TTWITTUN 고객지원</h1><p className="muted">앱 사용, 계정, GPS 기록, 대회 정보 관련 도움말</p></section>
  <section className="legalCard">
   <h2>앱이 느리거나 화면 전환이 지연돼요</h2><p>네트워크 상태를 확인한 뒤 앱을 다시 열어주세요. 지도와 대회 정보는 서버 데이터를 불러오기 때문에 연결 상태에 따라 첫 진입이 늦어질 수 있습니다.</p>
   <h2>GPS 기록이 잡히지 않아요</h2><p>휴대폰 설정에서 TTWITTUN의 위치 권한을 허용하고, 실외에서 위치 정확도가 안정된 뒤 러닝을 시작해주세요.</p>
   <h2>대회 정보가 잘못됐거나 빠졌어요</h2><p><Link href="/races/submit">빠진 대회 제보</Link>에서 공식 공지, Google Form, 인스타그램 또는 블로그 링크와 함께 제보할 수 있습니다.</p>
   <h2>계정 또는 개인정보 삭제</h2><p>로그인 후 <Link href="/my/account">MY &gt; 계정 관리</Link>에서 계정 및 저장 데이터 삭제를 요청할 수 있습니다. 요청 처리 상태도 같은 화면에서 확인할 수 있습니다.</p>
   <h2>관련 문서</h2><p><Link href="/privacy">개인정보 처리방침</Link>을 확인할 수 있습니다.</p>
  </section>
 </main>
}
