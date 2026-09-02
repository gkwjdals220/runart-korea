import Link from "next/link";
import Brand from "@/components/Brand";
import TreadmillCalculator from "@/components/TreadmillCalculator";
export default function TreadmillPage() {
  return (
    <main className="wrap treadmillPage">
      <header className="top compactPageTop">
        <Brand />
        <div className="nav">
          <Link className="btn ghost" href="/run/free">
            ← RUN
          </Link>
          <Link className="btn" href="/my/shoes">
            내 러닝화
          </Link>
        </div>
      </header>
      <TreadmillCalculator />
      <p className="muted treadmillNote">
        계산값은 벨트 속도 기준입니다. 트레드밀 기기 보정 상태와 러닝 폼에 따라
        실제 체감 페이스는 달라질 수 있어요.
      </p>
    </main>
  );
}
