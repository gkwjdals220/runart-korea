import Link from "next/link";
import { redirect } from "next/navigation";
import Brand from "@/components/Brand";
import ShoeMileageManager from "@/components/ShoeMileageManager";
import { createClient } from "@/lib/supabase/server";
export default async function ShoesPage({ searchParams }: { searchParams: Promise<{ brand?: string; model?: string; target?: string }> }) {
  const query = await searchParams;
  const preset = query.brand && query.model ? { brand: query.brand.slice(0, 60), model: query.model.slice(0, 100), target: query.target === "600" ? "600" : "500" } : null;
  const sb = await createClient(),
    {
      data: { user },
    } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: shoes }, { data: runs }] = await Promise.all([
    sb
      .from("runart_running_shoes")
      .select(
        "id,brand,model,nickname,initial_distance_km,target_distance_km,is_default,retired_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    sb
      .from("runart_live_runs")
      .select("shoe_id,distance_km")
      .eq("user_id", user.id)
      .not("shoe_id", "is", null),
  ]);
  const rows = (shoes || []).map((s: any) => ({
    ...s,
    run_km: (runs || [])
      .filter((r: any) => r.shoe_id === s.id)
      .reduce((a: number, r: any) => a + Number(r.distance_km || 0), 0),
  }));
  return (
    <main className="wrap shoePage">
      <header className="top compactPageTop">
        <Brand />
        <div className="nav">
          <Link className="btn ghost" href="/my">
            ← MY
          </Link>
          <Link className="btn" href="/shoes">
            신발 가이드
          </Link>
        </div>
      </header>
      <ShoeMileageManager userId={user.id} initial={rows} preset={preset} />
    </main>
  );
}
