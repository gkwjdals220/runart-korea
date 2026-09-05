"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const presets = [
  { label: "이지", pace: 420 },
  { label: "스테디", pace: 360 },
  { label: "템포", pace: 330 },
  { label: "인터벌", pace: 300 },
];

type RunShoe = {
  id: string;
  brand: string;
  model: string;
  nickname?: string | null;
  is_default: boolean;
};

function paceText(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}
function timeText(min: number) {
  const total = Math.round(min * 60),
    h = Math.floor(total / 3600),
    m = Math.floor((total % 3600) / 60),
    s = total % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export default function TreadmillCalculator({ userId }: { userId?: string | null }) {
  const router = useRouter();
  const [pace, setPace] = useState(360),
    [minutes, setMinutes] = useState(30),
    [incline, setIncline] = useState(0.5),
    [shoes, setShoes] = useState<RunShoe[]>([]),
    [shoeId, setShoeId] = useState(""),
    [saving, setSaving] = useState(false),
    [saveMessage, setSaveMessage] = useState("");
  const speed = useMemo(() => 60 / (pace / 60), [pace]),
    distance = (speed * minutes) / 60,
    elapsedSeconds = Math.round(minutes * 60);
  const setSpeed = (v: number) => setPace(Math.round(3600 / Math.max(1, v)));

  useEffect(() => {
    if (!userId) return;
    createClient()
      .from("runart_running_shoes")
      .select("id,brand,model,nickname,is_default")
      .eq("user_id", userId)
      .is("retired_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data || []) as RunShoe[];
        setShoes(list);
        setShoeId(list.find((s) => s.is_default)?.id || list[0]?.id || "");
      });
  }, [userId]);

  async function saveWorkout() {
    setSaveMessage("");
    if (!userId) {
      setSaveMessage("로그인하면 트레드밀 기록을 저장할 수 있어요.");
      return;
    }
    if (!Number.isFinite(distance) || distance <= 0 || elapsedSeconds <= 0) {
      setSaveMessage("거리와 시간을 확인해주세요.");
      return;
    }
    setSaving(true);
    try {
      const sb = createClient();
      const finishedAt = new Date();
      const startedAt = new Date(finishedAt.getTime() - elapsedSeconds * 1000);
      const km = Number(distance.toFixed(3));
      const avgPace = Math.round(elapsedSeconds / km);
      const { error } = await sb.from("runart_live_runs").insert({
        user_id: userId,
        course_id: null,
        crew_id: null,
        shoe_id: shoeId || null,
        run_mode: "treadmill",
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        elapsed_seconds: elapsedSeconds,
        distance_km: km,
        avg_pace_sec_per_km: avgPace,
        best_pace_sec_per_km: avgPace,
        pb_1k_sec: null,
        pb_3k_sec: null,
        pb_5k_sec: null,
        pb_10k_sec: null,
        pb_flags: [],
        splits: [],
        track_geojson: null,
      });
      if (error) throw error;
      setSaveMessage(`트레드밀 ${km.toFixed(2)}km 기록을 저장했어요. 경사도 ${incline}%`);
      router.refresh();
    } catch (error: any) {
      setSaveMessage(error?.message || "트레드밀 기록 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="treadmillStack">
      <section className="treadmillHero">
        <span className="eyebrow">TREADMILL RUN</span>
        <h1>
          {speed.toFixed(1)} <small>km/h</small>
        </h1>
        <p>{paceText(pace)}/km 페이스 · 예상 {distance.toFixed(2)}km</p>
      </section>
      <section className="card treadmillCard">
        <h2>목표 페이스</h2>
        <div className="paceInputs">
          <label>
            분
            <input inputMode="numeric" type="number" min="3" max="15" value={Math.floor(pace / 60)} onChange={(e) => setPace(Math.max(180, Number(e.target.value || 0) * 60 + (pace % 60)))} />
          </label>
          <b>:</b>
          <label>
            초
            <input inputMode="numeric" type="number" min="0" max="59" value={pace % 60} onChange={(e) => setPace(Math.floor(pace / 60) * 60 + Math.min(59, Number(e.target.value || 0)))} />
          </label>
          <span>/km</span>
        </div>
        <div className="presetRow">
          {presets.map((p) => (
            <button key={p.label} className={pace === p.pace ? "active" : ""} onClick={() => setPace(p.pace)}>
              {p.label}<small>{paceText(p.pace)}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card treadmillResult">
        <div><small>속도 설정</small><strong>{speed.toFixed(1)}<em>km/h</em></strong></div>
        <div><small>예상 거리</small><strong>{distance.toFixed(2)}<em>km</em></strong></div>
        <div><small>예상 시간</small><strong>{timeText(minutes)}<em>분:초</em></strong></div>
      </section>
      <section className="card treadmillCard">
        <h2>운동 설정</h2>
        <label className="rangeLabel">
          <span>시간 <b>{minutes}분</b></span>
          <input type="range" min="5" max="120" step="5" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </label>
        <label className="rangeLabel">
          <span>경사도 <b>{incline}%</b></span>
          <input type="range" min="0" max="5" step="0.5" value={incline} onChange={(e) => setIncline(Number(e.target.value))} />
        </label>
        <p className="muted">0%는 회복주, 0.5%는 자연스러운 주행감, 1%는 야외와 비슷한 체감 강도를 원하는 러너에게 권장해요.</p>
      </section>
      <section className="card treadmillCard">
        <h2>속도로 역계산</h2>
        <div className="speedInput">
          <input type="number" inputMode="decimal" min="4" max="24" step="0.1" value={speed.toFixed(1)} onChange={(e) => setSpeed(Number(e.target.value))} />
          <span>km/h</span><b>→ {paceText(pace)}/km</b>
        </div>
      </section>
      {userId && (
        <section className="card treadmillCard treadmillSaveCard">
          <div className="treadmillSaveHead">
            <div><span className="eyebrow">SAVE WORKOUT</span><h2>트레드밀 기록 저장</h2></div>
            <strong>{distance.toFixed(2)} km</strong>
          </div>
          {shoes.length > 0 && (
            <label className="treadmillShoeSelect">
              러닝화
              <select value={shoeId} onChange={(e) => setShoeId(e.target.value)}>
                <option value="">러닝화 연결 안 함</option>
                {shoes.map((shoe) => <option key={shoe.id} value={shoe.id}>{shoe.nickname || `${shoe.brand} ${shoe.model}`}</option>)}
              </select>
            </label>
          )}
          <div className="treadmillSaveSummary">
            <span><small>시간</small><b>{timeText(minutes)}</b></span>
            <span><small>페이스</small><b>{paceText(Math.round(elapsedSeconds / distance))}/km</b></span>
            <span><small>경사</small><b>{incline}%</b></span>
          </div>
          <button className="btn treadmillSaveButton" type="button" disabled={saving} onClick={saveWorkout}>{saving ? "저장 중…" : "운동 기록 저장"}</button>
          {saveMessage && <p className="muted formStatus" role="status">{saveMessage}</p>}
        </section>
      )}
      {!userId && <p className="muted treadmillLoginHint">로그인하면 트레드밀 운동도 내 러닝 기록과 러닝화 누적 거리에 저장됩니다.</p>}
    </div>
  );
}
