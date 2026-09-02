import Link from "next/link";
import Brand from "@/components/Brand";
const ranks = [
  {
    type: "데일리",
    name: "Nike Pegasus 41",
    drop: "10mm",
    note: "편안한 조깅·일상 훈련",
  },
  {
    type: "쿠션",
    name: "ASICS GEL-NIMBUS 27",
    drop: "8mm",
    note: "회복주·장거리 편안함",
  },
  {
    type: "템포",
    name: "adidas Adizero Boston 13",
    drop: "6mm",
    note: "스피드 훈련·롱런",
  },
  {
    type: "레이스",
    name: "Nike Vaporfly 4",
    drop: "6mm",
    note: "기록 도전·레이스",
  },
];
export default function ShoesGuide() {
  return (
    <main className="wrap shoeGuidePage">
      <header className="top compactPageTop">
        <Brand />
        <div className="nav">
          <Link className="btn ghost" href="/my">
            ← MY
          </Link>
          <Link className="btn" href="/my/shoes">
            내 러닝화
          </Link>
        </div>
      </header>
      <section className="compactPageHero">
        <span className="eyebrow">RUNNING SHOE GUIDE</span>
        <h1>러닝화 찾기</h1>
        <p className="muted">
          용도·드롭·훈련 목적을 기준으로 비교하세요. 순위는 절대 평가가 아닌
          선택 가이드입니다.
        </p>
      </section>
      <div className="shoeRankGrid">
        {ranks.map((r, i) => (
          <article className="card shoeRank" key={r.name}>
            <span>
              #{i + 1} · {r.type}
            </span>
            <h2>{r.name}</h2>
            <div>
              <b>드롭 {r.drop}</b>
              <p>{r.note}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="card releaseBoard">
        <span className="eyebrow">RELEASE CALENDAR</span>
        <h2>출시·판매 일정</h2>
        <p>
          브랜드 공식 발표를 기준으로 업데이트하며, 판매일·재고는 국가와
          판매처별로 달라질 수 있어요.
        </p>
        <div className="releaseEmpty">
          <b>새 공식 일정 확인 중</b>
          <span>확정되지 않은 루머 일정은 표시하지 않습니다.</span>
        </div>
        <div className="actions">
          <a
            className="btn ghost"
            href="https://www.nike.com/kr/launch"
            target="_blank"
            rel="noreferrer"
          >
            Nike SNKRS 확인
          </a>
          <a
            className="btn ghost"
            href="https://www.adidas.co.kr/running-shoes"
            target="_blank"
            rel="noreferrer"
          >
            adidas 확인
          </a>
        </div>
      </section>
      <section className="card dropGuide">
        <h2>드롭, 이렇게 고르세요</h2>
        <div>
          <b>0–4mm</b>
          <span>자연스러운 발 움직임 · 적응 기간 필요</span>
          <b>5–8mm</b>
          <span>균형형 · 다양한 훈련에 무난</span>
          <b>9mm+</b>
          <span>종아리·아킬레스 부담을 줄이고 싶은 러너가 선호</span>
        </div>
        <p className="muted">
          부상 이력과 러닝 폼에 따라 체감이 다릅니다. 급격한 드롭 변경은
          피하세요.
        </p>
      </section>
    </main>
  );
}
