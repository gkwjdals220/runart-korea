"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import RunModeV2 from "@/components/RunModeV2";
import {createClient} from "@/lib/supabase/client";

type Track={id:string;name:string;region:string;city:string|null;address:string|null;lat:number;lng:number;lap_m:number;access_note:string|null;verified:boolean};
type Preset={id:string;name:string;repM:number|null;reps:number|null;restSec:number;description:string};

const PRESETS:Preset[]=[
 {id:"free",name:"자유 400m 랩",repM:null,reps:null,restSec:0,description:"400m 자동랩만 켜고 자유롭게 달립니다."},
 {id:"400x8",name:"400m × 8",repM:400,reps:8,restSec:60,description:"400m 질주 후 60초 회복 · 총 3.2km 품질훈련"},
 {id:"800x6",name:"800m × 6",repM:800,reps:6,restSec:90,description:"800m 반복 후 90초 회복 · 총 4.8km 품질훈련"},
 {id:"1kx5",name:"1K × 5",repM:1000,reps:5,restSec:120,description:"1km 반복 후 120초 회복 · 총 5km 품질훈련"}
];

function fmt(sec:number){const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}

export default function TrackRunStudio({userId}:{userId?:string|null}){
 const [tracks,setTracks]=useState<Track[]>([]),[trackId,setTrackId]=useState(""),[presetId,setPresetId]=useState("free"),[rest,setRest]=useState(0),[resting,setResting]=useState(false),[loading,setLoading]=useState(true),[msg,setMsg]=useState(""),[runActive,setRunActive]=useState(false);
 const preset=useMemo(()=>PRESETS.find(x=>x.id===presetId)||PRESETS[0],[presetId]);
 const selected=useMemo(()=>tracks.find(x=>x.id===trackId)||null,[tracks,trackId]);
 useEffect(()=>{let alive=true;(async()=>{try{const sb=createClient();const {data,error}=await sb.from("runart_tracks").select("id,name,region,city,address,lat,lng,lap_m,access_note,verified").order("region").order("name");if(error)throw error;if(alive){setTracks((data||[]) as Track[]);if(data?.[0]?.id)setTrackId(data[0].id)}}catch(e:any){if(alive)setMsg(e?.message||"트랙 목록을 불러오지 못했습니다.")}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[]);
 useEffect(()=>{if(!resting)return;const t=window.setInterval(()=>setRest(v=>{if(v<=1){window.clearInterval(t);setResting(false);return 0}return v-1}),1000);return()=>window.clearInterval(t)},[resting]);
 function startRest(){if(!preset.restSec)return;setRest(preset.restSec);setResting(true)}
 function resetRest(){setRest(0);setResting(false)}
 const handleRunStateChange=useCallback((running:boolean,finished:boolean)=>setRunActive(running||finished),[]);
 const runName=["트랙런",selected?.name,preset.id!=="free"?preset.name:null].filter(Boolean).join(" · ");
 return <div className="trackStudioPage">
  <section className="wrap" style={{paddingBottom:0}}>
   <div className="card" style={{padding:18,marginTop:14}}>
    <div className="trackStudioSetupHeader"><div><span className="eyebrow">TRACK TRAINING</span><h2 style={{margin:"6px 0 4px"}}>🏟️ 트랙런 훈련 설정</h2><p className="muted">트랙 장소와 인터벌을 고른 뒤 아래에서 GPS 기록을 시작하세요.</p></div>{!runActive&&<Link className="btn ghost runExitButton" href="/my"><span aria-hidden="true">×</span><b>나가기</b></Link>}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:14}}>
     <label style={{display:"grid",gap:6}}><b>트랙 장소</b><select value={trackId} disabled={loading} onChange={e=>setTrackId(e.target.value)}><option value="">{loading?"트랙 불러오는 중…":"트랙 선택"}</option>{tracks.map(t=><option value={t.id} key={t.id}>{t.region} · {t.name}</option>)}</select></label>
     <label style={{display:"grid",gap:6}}><b>훈련 프리셋</b><select value={presetId} onChange={e=>{setPresetId(e.target.value);resetRest()}}>{PRESETS.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
    </div>
    <div className="miniStats" style={{marginTop:14}}><span><b>{selected?.lap_m||400}m</b>트랙 기준</span><span><b>{preset.repM?`${preset.repM}m × ${preset.reps}`:"FREE"}</b>훈련</span><span><b>{preset.restSec?`${preset.restSec}초`:"-"}</b>회복</span><span><b>{preset.repM&&preset.reps?`${(preset.repM*preset.reps/1000).toFixed(1)}km`:"자유"}</b>품질 거리</span></div>
    <p className="muted" style={{marginTop:10}}>{preset.description}</p>
    {selected&&<div className="card" style={{marginTop:12,padding:12}}><b>📍 {selected.name}</b><p className="muted" style={{margin:"4px 0"}}>{selected.address||`${selected.region} ${selected.city||""}`}</p><small>{selected.access_note||"일반 이용 가능 시간은 방문 전 확인하세요."}</small><div className="actions" style={{marginTop:8}}><a className="btn ghost" target="_blank" rel="noreferrer" href={`https://map.kakao.com/link/map/${encodeURIComponent(selected.name)},${selected.lat},${selected.lng}`}>지도에서 위치 확인</a></div></div>}
    {preset.restSec>0&&<div className="card" style={{marginTop:12,padding:14}}><span className="eyebrow">REST TIMER</span><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2 style={{margin:"4px 0"}}>{resting?fmt(rest):fmt(preset.restSec)}</h2><p className="muted" style={{margin:0}}>{resting?"회복 중 · 00:00이 되면 다음 반복을 시작하세요.":"한 반복을 마치면 휴식 시작을 눌러주세요."}</p></div><div className="actions"><button className="btn" type="button" onClick={startRest}>{resting?"↻ 휴식 다시 시작":"⏱ 휴식 시작"}</button>{resting&&<button className="btn ghost" type="button" onClick={resetRest}>휴식 종료</button>}</div></div></div>}
    {msg&&<p className="muted" style={{marginTop:10}}>{msg}</p>}
   </div>
  </section>
  <RunModeV2 trackRun courseName={runName} userId={userId||null} onRunStateChange={handleRunStateChange}/>
 </div>;
}
