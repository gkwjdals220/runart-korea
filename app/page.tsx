import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Brand from "@/components/Brand";
import HomePromoCarousel from "@/components/HomePromoCarousel";
import HomePersonalized, { HomeAccountFallback, HomeAccountLink, HomePersonalizedFallback } from "@/components/HomePersonalized";

const PROMOS = [
  { href: "/run/free", label: "오늘의 러닝 바로 시작", image: "/home-assets/banner-run.png" },
  { href: "/races", label: "다음 러닝 대회 목표 확인", image: "/home-assets/banner-race.png" },
  { href: "/explore", label: "러닝 코스 찾기", image: "/home-assets/banner-course.png" },
];

const QUICK_START = [
  ["/explore", "코스 찾기", "/home-assets/quick-course.png"],
  ["/run/treadmill", "트레드밀 페이스 계산", "/home-assets/quick-treadmill.png"],
  ["/shoes", "러닝화 추천과 출시 정보", "/home-assets/quick-shoes.png"],
  ["/run/free", "GPS 러닝 시작", "/home-assets/quick-run.png"],
  ["/my/history", "내 러닝 기록", "/home-assets/quick-history.png"],
  ["/my/pb", "개인 최고 기록 PB", "/home-assets/quick-pb.png"],
  ["/dashboard", "러닝 크루 활동", "/home-assets/quick-crew.png"],
  ["/races", "러닝 대회 일정", "/home-assets/quick-races.png"],
] as const;

export default function Home() {
  return <main className="wrap simpleHome actionHome">
    <header className="top simpleTop"><Brand/><nav className="homeDesktopNav" aria-label="주요 메뉴"><Link href="/explore">코스 탐색</Link><Link href="/run/free">RUN</Link><Link href="/races">대회</Link><Link href="/dashboard">크루</Link><Link href="/my">MY</Link></nav><div className="nav"><Suspense fallback={<HomeAccountFallback/>}><HomeAccountLink/></Suspense></div></header>
    <HomePromoCarousel cards={PROMOS}/>
    <section className="homeActionSection"><div className="homeSectionTitle"><div><small>QUICK START</small><h2>무엇을 할까요?</h2></div></div><div className="homeQuickGrid">{QUICK_START.map(([href,label,image],index)=><Link className={`quickImageCard${index===3?" primary":""}`} aria-label={label} href={href} prefetch key={href}><Image src={image} alt="" fill sizes="(max-width: 700px) 30vw, 13vw"/></Link>)}</div></section>
    <Suspense fallback={<HomePersonalizedFallback/>}><HomePersonalized/></Suspense>
    <section className="homeAdSlot" aria-label="프로모션 배너 영역"><div><small>TTWITTUN PARTNER</small><h2>러너에게 필요한 브랜드와 이벤트를<br/>이 공간에서 만날 수 있어요.</h2><p>브랜드 제휴 · 크루 이벤트 · 대회 프로모션 영역</p></div><span>AD</span></section>
  </main>;
}
