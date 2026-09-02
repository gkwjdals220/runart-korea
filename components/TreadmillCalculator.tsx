"use client";
import { useMemo, useState } from "react";

const presets = [
  { label: "이지", pace: 420 },
  { label: "스테디", pace: 360 },
  { label: "템포", pace: 330 },
  { label: "인터벌", pace: 300 },
];
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

export default function TreadmillCalculator() {
  const [pace, setPace] = useState(360),
    [minutes, setMinutes] = useState(30),
    [incline, setIncline] = useState(0.5);
  const speed = useMemo(() => 60 / (pace / 60), [pace]),
    distance = (speed * minutes) / 60;
  const setSpeed = (v: number) => setPace(Math.round(3600 / Math.max(1, v)));
  return (
    <div className="treadmillStack">
      <section className="treadmillHero">
        <span className="eyebrow">PACE → TREADMILL</span>
        <h1>
          {speed.toFixed(1)} <small>km/h</small>
        </h1>
        <p>{paceText(pace)}/km 페이스를 트레드밀 설정값으로 바꿨어요.</p>
      </section>
      <section className="card treadmillCard">
        <h2>목표 페이스</h2>
        <div className="paceInputs">
          <label>
            분
            <input
              inputMode="numeric"
              type="number"
              min="3"
              max="15"
              value={Math.floor(pace / 60)}
              onChange={(e) =>
                setPace(
                  Math.max(180, Number(e.target.value || 0) * 60 + (pace % 60)),
                )
              }
            />
          </label>
          <b>:</b>
          <label>
            초
            <input
              inputMode="numeric"
              type="number"
              min="0"
              max="59"
              value={pace % 60}
              onChange={(e) =>
                setPace(
                  Math.floor(pace / 60) * 60 +
                    Math.min(59, Number(e.target.value || 0)),
                )
              }
            />
          </label>
          <span>/km</span>
        </div>
        <div className="presetRow">
          {presets.map((p) => (
            <button
              key={p.label}
              className={pace === p.pace ? "active" : ""}
              onClick={() => setPace(p.pace)}
            >
              {p.label}
              <small>{paceText(p.pace)}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card treadmillResult">
        <div>
          <small>속도 설정</small>
          <strong>
            {speed.toFixed(1)}
            <em>km/h</em>
          </strong>
        </div>
        <div>
          <small>예상 거리</small>
          <strong>
            {distance.toFixed(2)}
            <em>km</em>
          </strong>
        </div>
        <div>
          <small>예상 시간</small>
          <strong>
            {timeText(minutes)}
            <em>분:초</em>
          </strong>
        </div>
      </section>
      <section className="card treadmillCard">
        <h2>운동 설정</h2>
        <label className="rangeLabel">
          <span>
            시간 <b>{minutes}분</b>
          </span>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <label className="rangeLabel">
          <span>
            경사도 <b>{incline}%</b>
          </span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={incline}
            onChange={(e) => setIncline(Number(e.target.value))}
          />
        </label>
        <p className="muted">
          0%는 회복주, 0.5%는 자연스러운 주행감, 1%는 야외와 비슷한 체감 강도를
          원하는 러너에게 권장해요. 개인 체감과 기기 오차에 맞춰 조절하세요.
        </p>
      </section>
      <section className="card treadmillCard">
        <h2>속도로 역계산</h2>
        <div className="speedInput">
          <input
            type="number"
            inputMode="decimal"
            min="4"
            max="24"
            step="0.1"
            value={speed.toFixed(1)}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span>km/h</span>
          <b>→ {paceText(pace)}/km</b>
        </div>
      </section>
    </div>
  );
}
