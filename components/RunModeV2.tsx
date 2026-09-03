"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pt = { lat: number; lng: number; ts: number; accuracy?: number };
type Split = {
  lap: number;
  distanceM: number;
  km: number;
  elapsed: number;
  lapSeconds: number;
  paceSecPerKm: number;
};
type Props = {
  courseId?: string | null;
  courseName?: string;
  targetKm?: number;
  routeGeojson?: any;
  startName?: string | null;
  userId?: string | null;
  crewId?: string | null;
  freeRun?: boolean;
  trackRun?: boolean;
  trackTools?: ReactNode;
  onRunStateChange?: (running: boolean, finished: boolean) => void;
};
type Draft = {
  version: 3;
  savedAt: number;
  startedAt: number;
  elapsed: number;
  distanceM: number;
  track: Pt[];
  splits: Split[];
  bestPace: number | null;
};
type PbResult = {
  oneK: number | null;
  threeK: number | null;
  fiveK: number | null;
  tenK: number | null;
  flags: string[];
};
type RunShoe = {
  id: string;
  brand: string;
  model: string;
  nickname?: string | null;
  is_default: boolean;
};

function haversineM(a: Pt, b: Pt) {
  const R = 6371000,
    toRad = (v: number) => (v * Math.PI) / 180,
    dLat = toRad(b.lat - a.lat),
    dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = Math.floor(sec % 60);
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtPace(sec: number | null | undefined) {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return "--:--";
  const m = Math.floor(sec / 60),
    s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function nearestRouteM(p: Pt, route: Pt[]) {
  if (route.length < 2) return null;
  let best = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i],
      b = route[i + 1],
      lat0 = (p.lat * Math.PI) / 180,
      sx = 111320 * Math.cos(lat0),
      sy = 110540,
      px = p.lng * sx,
      py = p.lat * sy,
      ax = a.lng * sx,
      ay = a.lat * sy,
      bx = b.lng * sx,
      by = b.lat * sy,
      dx = bx - ax,
      dy = by - ay,
      l2 = dx * dx + dy * dy,
      t = l2
        ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
        : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return Number.isFinite(best) ? best : null;
}
function bestSegmentSeconds(points: Pt[], targetM: number) {
  if (points.length < 2) return null;
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++)
    cum[i] = cum[i - 1] + haversineM(points[i - 1], points[i]);
  if (cum[cum.length - 1] < targetM) return null;
  let i = 0,
    best = Infinity;
  for (let j = 1; j < points.length; j++) {
    while (i + 1 < j && cum[j] - cum[i + 1] >= targetM) i++;
    if (cum[j] - cum[i] >= targetM) {
      const sec = (points[j].ts - points[i].ts) / 1000,
        pace = sec / (targetM / 1000);
      if (sec > 0 && pace >= 150 && pace <= 1200) best = Math.min(best, sec);
    }
  }
  return Number.isFinite(best) ? Math.round(best) : null;
}
function normalizeSplits(raw: any[], lapDistanceM: number): Split[] {
  return (raw || []).map((s: any, idx: number) => ({
    lap: Number(s.lap || idx + 1),
    distanceM: Number(s.distanceM || lapDistanceM),
    km: Number(s.km || ((idx + 1) * lapDistanceM) / 1000),
    elapsed: Number(s.elapsed || 0),
    lapSeconds: Number(s.lapSeconds || 0),
    paceSecPerKm: Number(s.paceSecPerKm || s.lapSeconds || 0),
  }));
}

export default function RunModeV2({
  courseId = null,
  courseName = "자유 러닝",
  targetKm = 0,
  routeGeojson = null,
  startName,
  userId,
  crewId,
  freeRun = false,
  trackRun = false,
  trackTools,
  onRunStateChange,
}: Props) {
  const route = useMemo<Pt[]>(
    () =>
      ((routeGeojson?.coordinates || []) as any[])
        .filter((x) => Array.isArray(x) && x.length >= 2)
        .map((x) => ({ lng: Number(x[0]), lat: Number(x[1]), ts: 0 }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [routeGeojson],
  );
  const mode = trackRun ? "track" : freeRun ? "free" : "course",
    lapDistanceM = trackRun ? 400 : 1000,
    lapLabel = trackRun ? "400m" : "1km";
  const key = `ttwittun:live-run:v3:${userId || "guest"}:${mode}:${courseId || "none"}`;
  const [running, setRunning] = useState(false),
    [paused, setPaused] = useState(false),
    [finished, setFinished] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [distanceM, setDistanceM] = useState(0),
    [accuracy, setAccuracy] = useState<number | null>(null),
    [routeDistance, setRouteDistance] = useState<number | null>(null),
    [message, setMessage] = useState("GPS 준비 중"),
    [saving, setSaving] = useState(false),
    [saveMessage, setSaveMessage] = useState("");
  const [currentPace, setCurrentPace] = useState<number | null>(null),
    [bestPace, setBestPace] = useState<number | null>(null),
    [splits, setSplits] = useState<Split[]>([]),
    [recoverable, setRecoverable] = useState<Draft | null>(null),
    [pb, setPb] = useState<PbResult | null>(null);
  const [shoes, setShoes] = useState<RunShoe[]>([]),
    [shoeId, setShoeId] = useState("");
  useEffect(() => {
    onRunStateChange?.(running, finished);
  }, [running, finished, onRunStateChange]);
  const watch = useRef<number | null>(null),
    startedAt = useRef<number | null>(null),
    pausedAt = useRef<number | null>(null),
    pausedTotal = useRef(0),
    last = useRef<Pt | null>(null),
    track = useRef<Pt[]>([]),
    distanceRef = useRef(0),
    elapsedRef = useRef(0),
    runningRef = useRef(false),
    pausedRef = useRef(false),
    finishedRef = useRef(false),
    splitsRef = useRef<Split[]>([]),
    lastLapElapsed = useRef(0),
    nextLap = useRef(1),
    paceWindow = useRef<Pt[]>([]),
    wake = useRef<any>(null);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);
  useEffect(() => {
    distanceRef.current = distanceM;
  }, [distanceM]);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);
  useEffect(() => {
    splitsRef.current = splits;
  }, [splits]);
  const persist = useCallback(() => {
    if (!runningRef.current || finishedRef.current || !startedAt.current)
      return;
    const d: Draft = {
      version: 3,
      savedAt: Date.now(),
      startedAt: startedAt.current,
      elapsed: elapsedRef.current,
      distanceM: distanceRef.current,
      track: track.current.slice(-6000),
      splits: splitsRef.current,
      bestPace,
    };
    try {
      localStorage.setItem(key, JSON.stringify(d));
    } catch {}
  }, [key, bestPace]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (d?.version === 3 && Date.now() - d.savedAt < 86400000)
          setRecoverable(d);
        else localStorage.removeItem(key);
      }
    } catch {}
  }, [key]);
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
  useEffect(() => {
    if (!running || finished) return;
    const t = window.setInterval(() => {
      if (startedAt.current && !pausedRef.current) {
        const e = Math.max(
          0,
          Math.floor(
            (Date.now() - startedAt.current - pausedTotal.current) / 1000,
          ),
        );
        elapsedRef.current = e;
        setElapsed(e);
      }
      persist();
    }, 1000);
    return () => clearInterval(t);
  }, [running, finished, persist]);
  useEffect(() => {
    const t =
      running && !finished ? window.setInterval(persist, 5000) : undefined;
    return () => {
      if (t) clearInterval(t);
    };
  }, [running, finished, persist]);
  async function wakeLock() {
    try {
      if (document.visibilityState === "visible")
        wake.current = await (navigator as any).wakeLock?.request?.("screen");
    } catch {}
  }
  function calcRollingPace() {
    const arr = paceWindow.current;
    if (arr.length < 2) return null;
    let d = 0;
    for (let i = 1; i < arr.length; i++) d += haversineM(arr[i - 1], arr[i]);
    const sec = (arr[arr.length - 1].ts - arr[0].ts) / 1000;
    if (d < 50 || sec < 12) return null;
    const p = sec / (d / 1000);
    return p >= 150 && p <= 1200 ? p : null;
  }
  function startGps() {
    if (!navigator.geolocation) {
      setMessage("이 기기에서는 GPS를 사용할 수 없습니다.");
      return;
    }
    if (watch.current != null) return;
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: Pt = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ts: Date.now(),
          accuracy: pos.coords.accuracy,
        };
        setAccuracy(pos.coords.accuracy);
        setRouteDistance(nearestRouteM(p, route));
        if (pos.coords.accuracy > 80) {
          last.current = null;
          setMessage(`GPS 정확도 낮음 ±${Math.round(pos.coords.accuracy)}m`);
          return;
        }
        setMessage("GPS 추적 중");
        if (runningRef.current && !pausedRef.current && !finishedRef.current) {
          if (last.current) {
            const jump = haversineM(last.current, p);
            if (jump > 1 && jump < 120) {
              distanceRef.current += jump;
              setDistanceM(distanceRef.current);
              track.current.push(p);
              paceWindow.current.push(p);
              paceWindow.current = paceWindow.current.filter(
                (x) => p.ts - x.ts <= 30000,
              );
              const cp = calcRollingPace();
              if (cp) {
                setCurrentPace(cp);
                setBestPace((v) => (v == null || cp < v ? cp : v));
              }
              const nowElapsed = elapsedRef.current;
              while (distanceRef.current >= nextLap.current * lapDistanceM) {
                const lapNo = nextLap.current,
                  lapSec = Math.max(1, nowElapsed - lastLapElapsed.current),
                  entry: Split = {
                    lap: lapNo,
                    distanceM: lapDistanceM,
                    km: Number(((lapNo * lapDistanceM) / 1000).toFixed(1)),
                    elapsed: nowElapsed,
                    lapSeconds: lapSec,
                    paceSecPerKm: Math.round(lapSec / (lapDistanceM / 1000)),
                  };
                splitsRef.current = [...splitsRef.current, entry];
                setSplits(splitsRef.current);
                lastLapElapsed.current = nowElapsed;
                nextLap.current += 1;
              }
            }
          } else {
            track.current.push(p);
            paceWindow.current = [p];
          }
          last.current = p;
        }
      },
      () => setMessage("위치 권한을 허용해주세요."),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 },
    );
  }
  function resetState() {
    distanceRef.current = 0;
    elapsedRef.current = 0;
    pausedTotal.current = 0;
    last.current = null;
    track.current = [];
    paceWindow.current = [];
    splitsRef.current = [];
    lastLapElapsed.current = 0;
    nextLap.current = 1;
    setDistanceM(0);
    setElapsed(0);
    setCurrentPace(null);
    setBestPace(null);
    setSplits([]);
    setSaveMessage("");
    setPb(null);
    setFinished(false);
  }
  function start() {
    try {
      localStorage.removeItem(key);
    } catch {}
    setRecoverable(null);
    resetState();
    startedAt.current = Date.now();
    runningRef.current = true;
    pausedRef.current = false;
    finishedRef.current = false;
    setRunning(true);
    setPaused(false);
    setMessage("GPS 연결 중");
    startGps();
    wakeLock();
  }
  function restore() {
    if (!recoverable) return;
    const d = recoverable,
      normalized = normalizeSplits(d.splits || [], lapDistanceM);
    distanceRef.current = d.distanceM;
    elapsedRef.current = d.elapsed;
    track.current = d.track || [];
    splitsRef.current = normalized;
    setDistanceM(d.distanceM);
    setElapsed(d.elapsed);
    setSplits(normalized);
    setBestPace(d.bestPace || null);
    lastLapElapsed.current = normalized.length
      ? normalized[normalized.length - 1].elapsed
      : 0;
    nextLap.current = normalized.length + 1;
    startedAt.current = Date.now() - d.elapsed * 1000;
    pausedAt.current = Date.now();
    runningRef.current = true;
    pausedRef.current = true;
    setRunning(true);
    setPaused(true);
    setRecoverable(null);
    setMessage("복구 완료 · 다시 시작을 눌러주세요.");
    startGps();
    wakeLock();
  }
  function togglePause() {
    if (!runningRef.current) return;
    if (!pausedRef.current) {
      pausedAt.current = Date.now();
      pausedRef.current = true;
      setPaused(true);
      setCurrentPace(null);
      persist();
    } else {
      if (pausedAt.current)
        pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      last.current = null;
      paceWindow.current = [];
      pausedRef.current = false;
      setPaused(false);
      setMessage("GPS 재확인 중");
      startGps();
      wakeLock();
    }
  }
  async function saveRun(finalElapsed: number, finalDistance: number) {
    const oneK = bestSegmentSeconds(track.current, 1000),
      threeK = bestSegmentSeconds(track.current, 3000),
      fiveK = bestSegmentSeconds(track.current, 5000),
      tenK = bestSegmentSeconds(track.current, 10000);
    if (!userId) {
      setPb({ oneK, threeK, fiveK, tenK, flags: [] });
      setSaveMessage("로그인하지 않아 서버 저장은 생략했습니다.");
      return true;
    }
    setSaving(true);
    try {
      const sb = createClient(),
        km = Number((finalDistance / 1000).toFixed(3)),
        avg = km >= 0.05 ? Math.round(finalElapsed / km) : null,
        trackGeo =
          track.current.length >= 2
            ? {
                type: "LineString",
                coordinates: track.current.map((p) => [p.lng, p.lat]),
                properties: {
                  points: track.current.map((p) => ({
                    ts: p.ts,
                    accuracy: p.accuracy,
                  })),
                },
              }
            : null;
      const { data: history } = await sb
        .from("runart_live_runs")
        .select("pb_1k_sec,pb_3k_sec,pb_5k_sec,pb_10k_sec,distance_km")
        .eq("user_id", userId)
        .limit(500);
      const rows = history || [],
        prevMin = (field: string) => {
          const vals = rows
            .map((r: any) => Number(r[field] || 0))
            .filter((v: number) => v > 0);
          return vals.length ? Math.min(...vals) : null;
        },
        flags: string[] = [];
      const compare = (
        label: string,
        value: number | null,
        prev: number | null,
      ) => {
        if (value && (prev == null || value < prev)) flags.push(label);
      };
      compare("1K", oneK, prevMin("pb_1k_sec"));
      compare("3K", threeK, prevMin("pb_3k_sec"));
      compare("5K", fiveK, prevMin("pb_5k_sec"));
      compare("10K", tenK, prevMin("pb_10k_sec"));
      const prevLongest = rows.reduce(
        (m: number, r: any) => Math.max(m, Number(r.distance_km || 0)),
        0,
      );
      if (km >= 0.4 && km > prevLongest + 0.01) flags.push("LONGEST");
      const pbResult: PbResult = { oneK, threeK, fiveK, tenK, flags };
      setPb(pbResult);
      const { error } = await sb
        .from("runart_live_runs")
        .insert({
          user_id: userId,
          course_id: mode === "course" ? courseId : null,
        crew_id: mode === "course" ? crewId || null : null,
        shoe_id: shoeId || null,
        run_mode: mode,
          started_at: new Date(startedAt.current || Date.now()).toISOString(),
          finished_at: new Date().toISOString(),
          elapsed_seconds: finalElapsed,
          distance_km: km,
          avg_pace_sec_per_km: avg,
          best_pace_sec_per_km: bestPace ? Math.round(bestPace) : null,
          pb_1k_sec: oneK,
          pb_3k_sec: threeK,
          pb_5k_sec: fiveK,
          pb_10k_sec: tenK,
          pb_flags: flags,
          splits: splitsRef.current,
          track_geojson: trackGeo,
        });
      if (error) throw error;
      setSaveMessage(
        flags.length
          ? `NEW PB 🎉 ${flags.map((x) => (x === "LONGEST" ? "최장거리" : x)).join(" · ")}`
          : "TTWITTUN 개인 러닝 기록에 저장했습니다.",
      );
      return true;
    } catch (e: any) {
      setSaveMessage(
        `${e?.message || "저장 중 오류가 발생했습니다."} · 임시 기록은 기기에 남아 있습니다.`,
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function finish() {
    if (!runningRef.current) return;
    persist();
    const finalElapsed = elapsedRef.current,
      finalDistance = distanceRef.current;
    runningRef.current = false;
    pausedRef.current = false;
    finishedRef.current = true;
    setRunning(false);
    setPaused(false);
    setFinished(true);
    if (watch.current != null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    wake.current?.release?.().catch(() => {});
    const ok = await saveRun(finalElapsed, finalDistance);
    if (ok)
      try {
        localStorage.removeItem(key);
      } catch {}
  }
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        last.current = null;
        persist();
        wake.current?.release?.().catch(() => {});
        wake.current = null;
      } else if (runningRef.current && !finishedRef.current) {
        last.current = null;
        paceWindow.current = [];
        startGps();
        wakeLock();
        setMessage(
          pausedRef.current
            ? "복귀 · 일시정지 중"
            : "화면 복귀 · GPS 재확인 중",
        );
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", persist);
      if (watch.current != null)
        navigator.geolocation.clearWatch(watch.current);
    };
  }, [persist]);
  const km = distanceM / 1000,
    avgPace = km >= 0.05 ? elapsed / km : null,
    progress = targetKm > 0 ? Math.min(100, (km / targetKm) * 100) : 0,
    offRoute = mode === "course" && routeDistance != null && routeDistance > 80,
    title = trackRun ? "트랙런" : freeRun ? "자유 러닝" : courseName,
    sub = trackRun
      ? "400m 트랙 기준 자동 랩 기록"
      : freeRun
        ? "코스 없이 내 기록 측정"
        : `${startName || "코스 출발점"}${targetKm ? ` · 목표 ${targetKm.toFixed(1)}km` : ""}`;
  return (
    <main className={`wrap runModePage ${trackRun ? "trackRunModePage" : ""}`}>
      {!trackRun && <header className="runModeTop">
        <div>
          <span className="eyebrow">TTWITTUN LIVE RUN</span>
          <h1>
            {trackRun ? "🏟️" : "🏃"} {title}
          </h1>
          <p>{sub}</p>
        </div>
        {!running && !trackRun && (
          <Link
            className="btn ghost runExitButton"
            href={
              mode === "course" && courseId ? `/courses/${courseId}` : "/my"
            }
          >
            <span aria-hidden="true">×</span>
            <b>나가기</b>
          </Link>
        )}
      </header>}
      {recoverable && !running && !finished && (
        <section className="card runGuideCard">
          <b>♻️ 중단된 러닝 기록</b>
          <p className="muted">
            {fmtTime(recoverable.elapsed)} ·{" "}
            {(recoverable.distanceM / 1000).toFixed(2)}km까지 복구할 수
            있습니다.
          </p>
          <div className="actions">
            <button className="btn" onClick={restore}>
              이어달리기 복구
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                localStorage.removeItem(key);
                setRecoverable(null);
              }}
            >
              삭제
            </button>
          </div>
        </section>
      )}
      {!trackRun && !running && !finished && userId && (
        <section className="card runShoePicker">
          <div>
            <span className="eyebrow">RUNNING SHOE</span>
            <h3>오늘 신을 러닝화</h3>
          </div>
          {shoes.length ? (
            <select value={shoeId} onChange={(e) => setShoeId(e.target.value)}>
              {shoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nickname || s.model} · {s.brand}
                </option>
              ))}
            </select>
          ) : (
            <Link className="btn ghost" href="/my/shoes">
              ＋ 러닝화 등록
            </Link>
          )}
        </section>
      )}
      {trackRun && !running && !finished && (
        <section className="card runGuideCard trackReadyCard">
          <span className="eyebrow">READY TO RUN</span>
          <b>트랙과 훈련 설정을 확인했어요</b>
          <p className="muted">
            아래 러닝 시작을 누르면 GPS 기록과 400m 자동 랩이 함께 시작됩니다.
          </p>
        </section>
      )}
      {(!trackRun || running || finished) && <>
      <section className="runMetricPanel">
        <div>
          <strong>{km.toFixed(2)}</strong>
          <small>km</small>
        </div>
        <div>
          <strong>{fmtTime(elapsed)}</strong>
          <small>시간</small>
        </div>
        <div>
          <strong>{fmtPace(currentPace)}</strong>
          <small>현재 페이스</small>
        </div>
        <div>
          <strong>{fmtPace(avgPace)}</strong>
          <small>평균 페이스</small>
        </div>
        {targetKm > 0 && (
          <div className="runProgress">
            <span style={{ width: `${progress}%` }} />
            <small>목표 대비 {progress.toFixed(0)}%</small>
          </div>
        )}
      </section>
      {trackRun && running && trackTools}
      <section className="runStatusGrid">
        <div className="card runStatusCard">
          <span className="eyebrow">PERSONAL RECORD</span>
          <h3>⚡ 최고 페이스 {fmtPace(bestPace)}/km</h3>
          <p className="muted">
            {lapLabel} 자동랩 {splits.length}개 · GPS ±
            {accuracy ? Math.round(accuracy) : "-"}m
          </p>
        </div>
        <div className={`card runStatusCard ${offRoute ? "warning" : ""}`}>
          <span className="eyebrow">
            {trackRun ? "TRACK" : freeRun ? "GPS" : "COURSE"}
          </span>
          <h3>
            {trackRun
              ? `🏟️ ${Math.floor(distanceM / 400)}바퀴 + ${Math.round(distanceM % 400)}m`
              : freeRun
                ? "📍 자유 경로 기록"
                : offRoute
                  ? "⚠️ 코스 이탈"
                  : "✅ 코스 추적"}
          </h3>
          <p className="muted">
            {trackRun
              ? "표준 400m 트랙 기준으로 랩을 자동 계산합니다."
              : freeRun
                ? "달린 경로를 자동으로 저장합니다."
                : routeDistance == null
                  ? "코스와 현재 위치를 확인 중입니다."
                  : `경로선까지 약 ${Math.round(routeDistance)}m`}
          </p>
        </div>
      </section>
      </>}
      {!!splits.length && (
        <section className="card" style={{ marginTop: 14 }}>
          <span className="eyebrow">AUTO LAP</span>
          <h3>{lapLabel} 스플릿</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {splits.map((s) => (
              <div
                key={s.lap}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 90px",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(127,127,127,.2)",
                }}
              >
                <b>{trackRun ? `L${s.lap}` : `${s.km}K`}</b>
                <span>{fmtTime(s.lapSeconds)}</span>
                <strong>{fmtPace(s.paceSecPerKm)}/km</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      {(!trackRun || running || finished) && <section className="card runGuideCard">
        <b>
          {finished
            ? "🏁 러닝 완료"
            : paused
              ? "⏸ 일시정지"
              : running
                ? "🟢 기록 중"
                : "출발 준비 완료"}
        </b>
        <p className="muted">
          {finished
            ? saving
              ? "기록 저장 중…"
              : saveMessage
            : running
              ? message
              : "GPS 권한을 허용한 뒤 시작해주세요."}
        </p>
      </section>}
      {finished && (
        <section className="section">
          <div className="card runCompleteCard">
            <span className="eyebrow">TTWITTUN RUN COMPLETE</span>
            <h2>개인 러닝 기록</h2>
            {pb && pb.flags.length > 0 && (
              <div className="card" style={{ margin: "12px 0" }}>
                <b>🎉 NEW PB</b>
                <p>
                  {pb.flags
                    .map((x) => (x === "LONGEST" ? "최장거리" : x))
                    .join(" · ")}
                </p>
              </div>
            )}
            <div className="miniStats">
              <span>
                <b>{km.toFixed(2)}km</b>거리
              </span>
              <span>
                <b>{fmtTime(elapsed)}</b>시간
              </span>
              <span>
                <b>{fmtPace(avgPace)}/km</b>평균
              </span>
              <span>
                <b>{fmtPace(bestPace)}/km</b>최고
              </span>
              {trackRun && (
                <span>
                  <b>{Math.floor(distanceM / 400)}</b>완주 랩
                </span>
              )}
            </div>
            {pb && (
              <div className="miniStats" style={{ marginTop: 10 }}>
                <span>
                  <b>{pb.oneK ? fmtTime(pb.oneK) : "-"}</b>Best 1K
                </span>
                <span>
                  <b>{pb.threeK ? fmtTime(pb.threeK) : "-"}</b>Best 3K
                </span>
                <span>
                  <b>{pb.fiveK ? fmtTime(pb.fiveK) : "-"}</b>Best 5K
                </span>
                <span>
                  <b>{pb.tenK ? fmtTime(pb.tenK) : "-"}</b>Best 10K
                </span>
              </div>
            )}
            <div className="actions">
              <Link className="btn" href="/my">
                MY 기록
              </Link>
              {mode === "course" && courseId && (
                <Link
                  className="btn ghost"
                  href={`/courses/${courseId}#after-run`}
                >
                  🍚 러닝 후
                </Link>
              )}
              <button className="btn ghost" onClick={start}>
                ↻ 다시 뛰기
              </button>
            </div>
          </div>
        </section>
      )}
      <div className="runControlDock">
        {!running && !finished && (
          <button className="runPrimaryControl" onClick={start}>
            ▶ 러닝 시작
          </button>
        )}
        {running && (
          <button className="runPrimaryControl" onClick={togglePause}>
            {paused ? "▶ 다시 시작" : "⏸ 일시정지"}
          </button>
        )}
        {running && (
          <button className="runStopControl" onClick={finish}>
            ■ 종료
          </button>
        )}
        {!running && finished && (
          <Link className="runPrimaryControl linkControl" href="/my">
            MY 기록
          </Link>
        )}
        {mode === "course" && courseId && (
          <a className="runMapControl" href={`/?course=${courseId}#explore`}>
            🗺️ 지도
          </a>
        )}
      </div>
      <p className="muted runFootnote">
        TTWITTUN은 약 5초마다 러닝 기록을 기기에 임시 저장합니다. 트랙런의 랩은
        GPS 거리 기준이며, 경기장 전광판/공인 계측과 차이가 날 수 있습니다.
        모바일 웹에서는 화면 잠금·백그라운드 상태에서 GPS 제공이 중단될 수
        있습니다.
      </p>
    </main>
  );
}
