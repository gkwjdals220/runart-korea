"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
type Shoe = {
  id: string;
  brand: string;
  model: string;
  nickname?: string | null;
  initial_distance_km: number;
  target_distance_km: number;
  is_default: boolean;
  retired_at?: string | null;
  run_km: number;
  run_count: number;
  last_run_at?: string | null;
};
export default function ShoeMileageManager({
  userId,
  initial,
  preset,
}: {
  userId: string;
  initial: Shoe[];
  preset?: { brand: string; model: string; target: string } | null;
}) {
  const [shoes, setShoes] = useState(initial),
    [open, setOpen] = useState(Boolean(preset?.brand && preset?.model)),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      brand: preset?.brand || "",
      model: preset?.model || "",
      nickname: "",
      initial: "0",
      target: preset?.target || "500",
    });
  async function refresh() {
    const sb = createClient();
    const { data } = await sb
      .from("runart_running_shoes")
      .select(
        "id,brand,model,nickname,initial_distance_km,target_distance_km,is_default,retired_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const { data: runs } = await sb
      .from("runart_live_runs")
      .select("shoe_id,distance_km,finished_at")
      .eq("user_id", userId)
      .not("shoe_id", "is", null);
    setShoes(
      (data || []).map((s: any) => ({
        ...s,
        run_km: (runs || []).filter((r: any) => r.shoe_id === s.id).reduce((a: number, r: any) => a + Number(r.distance_km || 0), 0),
        run_count: (runs || []).filter((r: any) => r.shoe_id === s.id).length,
        last_run_at: (runs || []).filter((r: any) => r.shoe_id === s.id && r.finished_at).sort((a: any,b: any) => String(b.finished_at).localeCompare(String(a.finished_at)))[0]?.finished_at || null,
      })),
    );
  }
  async function add() {
    if (!form.brand.trim() || !form.model.trim()) return;
    setBusy(true);
    const sb = createClient(),
      isFirst = !shoes.some((s) => !s.retired_at);
    await sb
      .from("runart_running_shoes")
      .insert({
        user_id: userId,
        brand: form.brand.trim(),
        model: form.model.trim(),
        nickname: form.nickname.trim() || null,
        initial_distance_km: Number(form.initial) || 0,
        target_distance_km: Number(form.target) || 500,
        is_default: isFirst,
      });
    await refresh();
    setForm({
      brand: "",
      model: "",
      nickname: "",
      initial: "0",
      target: "500",
    });
    setOpen(false);
    setBusy(false);
  }
  async function makeDefault(id: string) {
    setBusy(true);
    const sb = createClient();
    await sb
      .from("runart_running_shoes")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    await sb
      .from("runart_running_shoes")
      .update({
        is_default: true,
        retired_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId);
    await refresh();
    setBusy(false);
  }
  async function retire(s: Shoe) {
    setBusy(true);
    const sb = createClient();
    await sb
      .from("runart_running_shoes")
      .update({
        retired_at: s.retired_at ? null : new Date().toISOString(),
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", s.id)
      .eq("user_id", userId);
    await refresh();
    setBusy(false);
  }
  const activeShoes=shoes.filter(s=>!s.retired_at);
  const totalKm=shoes.reduce((sum,s)=>sum+Number(s.initial_distance_km||0)+Number(s.run_km||0),0);
  const totalRuns=shoes.reduce((sum,s)=>sum+Number(s.run_count||0),0);
  const attentionCount=activeShoes.filter(s=>{const km=Number(s.initial_distance_km)+Number(s.run_km||0);return km/Number(s.target_distance_km||500)>=.8}).length;
  const formatDate=(value?:string|null)=>value?new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric"}).format(new Date(value)):"기록 없음";
  return (
    <>
      <div className="shoeToolbar">
        <div>
          <span className="eyebrow">SHOE ROTATION</span>
          <h1>내 러닝화</h1>
          <p className="muted">
            러닝을 저장하면 선택한 신발의 거리가 자동 누적돼요.
          </p>
        </div>
        <button className="btn" onClick={() => setOpen((v) => !v)}>
          ＋ 신발 추가
        </button>
      </div>
      {preset?.brand && preset?.model && open && (
        <p className="shoePresetNotice">추천 가이드에서 <b>{preset.brand} {preset.model}</b>을 가져왔어요. 현재 거리와 별명만 확인한 뒤 등록하세요.</p>
      )}
      {open && (
        <section className="card shoeForm">
          <label>
            브랜드
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="예: Nike"
            />
          </label>
          <label>
            모델
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="예: Pegasus 41"
            />
          </label>
          <label>
            별명
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="선택 입력"
            />
          </label>
          <div className="shoeFormRow">
            <label>
              현재 거리(km)
              <input
                type="number"
                inputMode="decimal"
                value={form.initial}
                onChange={(e) => setForm({ ...form, initial: e.target.value })}
              />
            </label>
            <label>
              교체 목표(km)
              <input
                type="number"
                inputMode="numeric"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
            </label>
          </div>
          <button className="btn" disabled={busy} onClick={add}>
            {busy ? "저장 중…" : "등록하기"}
          </button>
        </section>
      )}
      <section className="shoeSummaryGrid" aria-label="러닝화 사용 요약">
        <div><span>사용 중</span><b>{activeShoes.length}</b><small>켤레</small></div>
        <div><span>누적 거리</span><b>{totalKm.toFixed(1)}</b><small>km</small></div>
        <div><span>연결 러닝</span><b>{totalRuns}</b><small>회</small></div>
        <div className={attentionCount?"attention":""}><span>교체 점검</span><b>{attentionCount}</b><small>켤레</small></div>
      </section>
      {attentionCount>0&&<div className="shoeFleetAlert" role="status"><b>러닝화 상태를 확인할 때예요.</b><span>교체 목표의 80% 이상을 사용한 신발이 {attentionCount}켤레 있습니다. 밑창 마모와 쿠션 변화를 확인하세요.</span></div>}
      <div className="shoeGrid">
        {shoes.map((s) => {
          const km = Number(s.initial_distance_km) + s.run_km,
            pct = Math.min(100, (km / Number(s.target_distance_km)) * 100);
          return (
            <article
              className={`card shoeCard ${s.retired_at ? "retired" : ""}`}
              key={s.id}
            >
              <div className="shoeCardTop">
                <span>{s.is_default ? "달릴 신발" : "러닝화"}</span>
                {s.retired_at && <span>사용 종료</span>}
              </div>
              <h2>{s.nickname || s.model}</h2>
              <p>
                {s.brand} · {s.model}
              </p>
              <div className="shoeKm">
                <strong>{km.toFixed(1)}</strong>
                <span>/ {Number(s.target_distance_km).toFixed(0)} km</span>
              </div>
              <div className="shoeProgress">
                <span style={{ width: `${pct}%` }} />
              </div>
              <small className={pct>=100?"shoeWearMessage danger":pct>=80?"shoeWearMessage warning":"shoeWearMessage"}>
                {pct>=100?"교체 목표에 도달했어요":pct>=80?`교체 점검 구간 · 목표까지 ${(Number(s.target_distance_km)-km).toFixed(1)}km`:`교체 목표까지 ${(Number(s.target_distance_km)-km).toFixed(1)}km`}
              </small>
              <div className="shoeUsageStats"><span><b>{s.run_count||0}</b>회 러닝</span><span>최근 사용 <b>{formatDate(s.last_run_at)}</b></span></div>
              <div className="actions">
                {!s.is_default && !s.retired_at && (
                  <button
                    disabled={busy}
                    className="btn ghost"
                    onClick={() => makeDefault(s.id)}
                  >
                    기본 신발
                  </button>
                )}
                <button
                  disabled={busy}
                  className="btn ghost"
                  onClick={() => retire(s)}
                >
                  {s.retired_at ? "다시 사용" : "사용 종료"}
                </button>
              </div>
            </article>
          );
        })}
        {!shoes.length && (
          <div className="card emptyState">
            <b>등록한 러닝화가 없어요.</b>
            <p className="muted">
              첫 신발을 추가하면 이후 러닝 거리가 자동으로 쌓입니다.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
