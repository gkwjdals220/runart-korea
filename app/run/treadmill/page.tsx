import TreadmillCalculator from "@/components/TreadmillCalculator";
import { createClient } from "@/lib/supabase/server";

export default async function TreadmillPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <main className="wrap treadmillPage mobileSubPage">
      <TreadmillCalculator userId={user?.id || null} />
      <p className="muted treadmillNote">
        계산값은 벨트 속도 기준입니다. 트레드밀 기기 보정 상태와 러닝 폼에 따라
        실제 체감 페이스는 달라질 수 있어요.
      </p>
    </main>
  );
}
