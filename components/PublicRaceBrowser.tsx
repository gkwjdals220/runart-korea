"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";

type Race={
  source_key:string;
  name:string;
  race_date:string;
  region:string|null;
  distance_options:string[];
  registration_start?:string|null;
  registration_deadline:string|null;
  registration_status:string;
  official_url:string|null;
  registration_url?:string|null;
  registration_text?:string|null;
  source_name:string;
  source_url:string;
  source_kind?:string;
};

type Saved={
  source_key:string;
  race_name:string;
  race_date:string|null;
  region:string|null;
  official_url:string|null;
  status:string;
  distance:string|null;
  note:string|null;
};

const STATUS:Record<string,string>={interested:"관심",applied:"신청완료",going:"참가예정",not_going:"불참"};
const REG:Record<string,string>={open:"접수중",closed:"접수마감",upcoming:"접수예정",unknown:"접수확인"};
const DISTANCE_FILTERS=["전체","Full","Half","10K","5K","기타"] as const;
type DistanceFilter=(typeof DISTANCE_FILTERS)[number];

function dday(date:string){
  const a=new Date(`${date}T00:00:00+09:00`).getTime();
  const b=new Date();
  b.setHours(0,0,0,0);
  const d=Math.ceil((a-b.getTime())/86400000);
  return d===0?"D-DAY":d>0?`D-${d}`:"종료";
}

function legacyKey(r:Race){return `${r.name.replace(/\s/g,"").toLowerCase()}|${r.race_date}`}
function sourceLabel(name:string){return name==="kimrunning"?"김러닝":name==="runfor"?"RUNFOR":name==="marathonmoa"?"마라톤모아":name==="community"?"러너 제보":"Rung"}
function normalizeDistance(distance:string|null|undefined){return distance?.trim().toLowerCase()==="ultra"?"Full":distance||""}
function monthKey(date:string){return date?.slice(0,7)||"미정"}
function monthLabel(key:string){const [y,m]=key.split("-");return y&&m?`${y}년 ${Number(m)}월`:"일정 미정"}
function weekday(date:string){return new Intl.DateTimeFormat("ko-KR",{weekday:"short",timeZone:"Asia/Seoul"}).format(new Date(`${date}T00:00:00+09:00`))}
function dayOfMonth(date:string){return Number(date?.slice(8,10)||0)}

function distanceMatches(r:Race,filter:DistanceFilter){
  if(filter==="전체") return true;
  const values=(r.distance_options||[]).map(d=>normalizeDistance(d).toLowerCase());
  const joined=values.join(" ");
  if(filter==="Full") return /(^|\s)(full|42k|42\.195k|42\.195)(\s|$)/i.test(joined);
  if(filter==="Half") return /(^|\s)(half|21k|21\.0975k)(\s|$)/i.test(joined);
  if(filter==="10K") return values.some(v=>/^10k$/i.test(v));
  if(filter==="5K") return values.some(v=>/^5k$/i.test(v));
  return !distanceMatches(r,"Full")&&!distanceMatches(r,"Half")&&!distanceMatches(r,"10K")&&!distanceMatches(r,"5K");
}

function Icon({name}:{name:"heart"|"share"|"note"|"trash"}){
  const common={fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    {name==="heart"&&<path {...common} d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 5.9l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.5l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/>}
    {name==="share"&&<><circle {...common} cx="18" cy="5" r="2.4"/><circle {...common} cx="6" cy="12" r="2.4"/><circle {...common} cx="18" cy="19" r="2.4"/><path {...common} d="m8.1 10.8 7.7-4.5M8.1 13.2l7.7 4.5"/></>}
    {name==="note"&&<><path {...common} d="M5 4.5h14v15H5z"/><path {...common} d="M8 8h8M8 12h8M8 16h5"/></>}
    {name==="trash"&&<><path {...common} d="M4 7h16M9 7V4.5h6V7M7 7l1 13h8l1-13"/><path {...common} d="M10 11v5M14 11v5"/></>}
  </svg>;
}

export default function PublicRaceBrowser({userId,initialSaved,initialMineOnly=false}:{userId:string|null;initialSaved:Saved[];initialMineOnly?:boolean}){
  const normalizedInitialSaved=useMemo(()=>initialSaved.map(x=>({...x,distance:normalizeDistance(x.distance)||null})),[initialSaved]);
  const[races,setRaces]=useState<Race[]>([]);
  const[saved,setSaved]=useState(new Map(normalizedInitialSaved.map(x=>[x.source_key,x])));
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[actionMsg,setActionMsg]=useState("");
  const[q,setQ]=useState("");
  const[region,setRegion]=useState("");
  const[status,setStatus]=useState("");
  const[mineOnly,setMineOnly]=useState(initialMineOnly);
  const[formsOnly,setFormsOnly]=useState(false);
  const[distanceFilter,setDistanceFilter]=useState<DistanceFilter>("전체");
  const[busy,setBusy]=useState("");
  const[noteOpen,setNoteOpen]=useState("");
  const[noteDraft,setNoteDraft]=useState("");
  const[meta,setMeta]=useState({count:0,formCount:0});

  const legacySaved=useMemo(()=>new Map(Array.from(saved.values()).map(x=>[`${x.race_name.replace(/\s/g,"").toLowerCase()}|${x.race_date||""}`,x])),[saved]);
  function savedFor(r:Race){return saved.get(r.source_key)||legacySaved.get(legacyKey(r))}

  async function load(){
    setLoading(true);setError("");
    try{
      const res=await fetch("/api/races/live",{cache:"no-store"});
      const j=await res.json();
      if(!res.ok) throw new Error(j?.error||j?.partial_errors?.join(" · ")||"대회 정보를 불러오지 못했습니다.");
      setRaces(j.races||[]);
      setMeta({count:j.count||0,formCount:j.google_form_count||0});
    }catch(e:any){setError(e?.message||"대회 정보를 불러오지 못했습니다.")}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  const regions=useMemo(()=>Array.from(new Set(races.map(x=>x.region).filter(Boolean) as string[])).sort(),[races]);
  const filtered=useMemo(()=>races.filter(r=>{
    if(q&&!`${r.name} ${r.region||""} ${(r.distance_options||[]).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    if(region&&r.region!==region) return false;
    if(status&&r.registration_status!==status) return false;
    if(mineOnly&&!savedFor(r)) return false;
    if(formsOnly&&!r.registration_url) return false;
    if(!distanceMatches(r,distanceFilter)) return false;
    return true;
  }).sort((a,b)=>a.race_date.localeCompare(b.race_date)),[races,q,region,status,mineOnly,formsOnly,distanceFilter,saved,legacySaved]);

  const grouped=useMemo(()=>{
    const map=new Map<string,Race[]>();
    filtered.forEach(r=>{const key=monthKey(r.race_date);map.set(key,[...(map.get(key)||[]),r])});
    return Array.from(map.entries());
  },[filtered]);

  async function saveRace(r:Race,nextStatus:string,distance?:string,note?:string){
    if(!userId||busy)return false;
    setBusy(r.source_key);setActionMsg("");
    const sb=createClient(),prev=savedFor(r),normalizedDistance=distance!==undefined?normalizeDistance(distance):(normalizeDistance(prev?.distance)||null);
    const payload={user_id:userId,source_key:r.source_key,race_name:r.name,race_date:r.race_date||null,region:r.region||null,official_url:r.official_url||r.registration_url||null,status:nextStatus,distance:normalizedDistance||null,note:note??prev?.note??null,updated_at:new Date().toISOString()};
    try{
      const{error}=await sb.from("runart_public_race_participation").upsert(payload,{onConflict:"user_id,source_key"});
      if(error)throw error;
      const next=new Map(saved);if(prev&&prev.source_key!==r.source_key)next.delete(prev.source_key);next.set(r.source_key,payload as Saved);setSaved(next);
      setActionMsg(`${r.name} · ${STATUS[nextStatus]||nextStatus}로 저장했습니다.`);return true;
    }catch(e:any){setActionMsg(e?.message||"대회 상태 저장 중 오류가 발생했습니다.");return false}
    finally{setBusy("")}
  }

  async function removeRace(r:Race){
    if(!userId||busy)return;
    const me=savedFor(r);if(!me||!confirm(`${r.name}의 내 대회 기록을 해제할까요?`))return;
    setBusy(r.source_key);setActionMsg("");const sb=createClient();
    try{const{error}=await sb.from("runart_public_race_participation").delete().eq("user_id",userId).eq("source_key",me.source_key);if(error)throw error;const next=new Map(saved);next.delete(me.source_key);setSaved(next);setNoteOpen("");setActionMsg(`${r.name} 기록을 해제했습니다.`)}
    catch(e:any){setActionMsg(e?.message||"대회 기록 해제 중 오류가 발생했습니다.")}
    finally{setBusy("")}
  }

  async function shareRace(r:Race){
    const url=r.official_url||r.registration_url||r.source_url||location.href;
    const text=`${r.name} · ${r.race_date}${r.region?` · ${r.region}`:""}`;
    try{if(navigator.share){await navigator.share({title:r.name,text,url});return}await navigator.clipboard.writeText(`${text}\n${url}`);setActionMsg("대회 링크를 복사했습니다.")}
    catch(e:any){if(e?.name!=="AbortError")setActionMsg("공유를 열지 못했습니다.")}
  }

  return <div className="publicRaceBrowser raceListV2">
    <div className="raceFinderBar">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="대회명·지역·거리 검색" aria-label="대회 검색"/>
      <select value={region} onChange={e=>setRegion(e.target.value)} aria-label="지역 필터"><option value="">전국</option>{regions.map(x=><option key={x}>{x}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="접수 상태 필터"><option value="">접수상태 전체</option><option value="open">접수중</option><option value="upcoming">접수예정</option><option value="closed">접수마감</option><option value="unknown">확인필요</option></select>
      <button type="button" aria-pressed={formsOnly} className={`chip ${formsOnly?"on":""}`} onClick={()=>setFormsOnly(v=>!v)}>Google Form {meta.formCount?`· ${meta.formCount}`:""}</button>
      {userId&&<button type="button" aria-pressed={mineOnly} className={`chip ${mineOnly?"on":""}`} onClick={()=>setMineOnly(v=>!v)}>내 대회</button>}
    </div>

    <div className="raceDistanceTabs" role="tablist" aria-label="코스 거리 필터">
      {DISTANCE_FILTERS.map(item=><button key={item} type="button" role="tab" aria-selected={distanceFilter===item} className={distanceFilter===item?"active":""} onClick={()=>setDistanceFilter(item)}>{item}</button>)}
    </div>

    <div className="raceSourceRow"><span role="status">{loading?"대회 정보를 업데이트하는 중…":`${filtered.length}개 대회`}</span><div><Link className="textReset" href={userId?"/races/my":"/login"}>{userId?"내 일정":"로그인"}</Link><button className="textReset" type="button" disabled={loading} onClick={load}>{loading?"갱신 중…":"새로고침"}</button></div></div>

    {error&&<div className="card raceError" role="alert"><b>실시간 대회 정보를 불러오지 못했어요.</b><p>{error}</p><button className="btn ghost" type="button" onClick={load}>다시 시도</button></div>}

    <div className="raceMonthList" aria-busy={loading}>
      {grouped.map(([month,raceGroup])=><section className="raceMonthSection" key={month}>
        <div className="raceMonthHeading"><span>{monthLabel(month)}</span><small>{raceGroup.length}개 일정</small></div>
        <div className="raceMonthCards">
          {raceGroup.map(r=>{
            const me=savedFor(r),editing=noteOpen===r.source_key;
            const personalDistances=Array.from(new Set((r.distance_options||[]).map(d=>normalizeDistance(d)).filter(Boolean)));
            return <article className={`raceListItem ${me?"savedRace":""}`} key={r.source_key}>
              <div className="raceListDate"><b>{dayOfMonth(r.race_date)}</b><span>{weekday(r.race_date)}</span><small>{dday(r.race_date)}</small></div>
              <div className="raceListContent">
                <div className="raceListTitleRow"><div><p>{r.region||"지역 미정"}</p><h3>{r.name}</h3></div><span className={`raceRegStatus ${r.registration_status}`}>{REG[r.registration_status]||"확인"}</span></div>
                <div className="raceListDistances">{(r.distance_options||[]).map(d=><span key={d}>{normalizeDistance(d)}</span>)}</div>
                <div className="raceListMeta"><span>{sourceLabel(r.source_name)}</span>{r.registration_deadline&&<span>마감 {r.registration_deadline}</span>}</div>
                {r.registration_text&&<p className="raceListDescription">{r.registration_text}</p>}

                <div className="raceQuickActions">
                  {userId&&<>
                    <button type="button" title="관심" aria-label="관심" aria-pressed={me?.status==="interested"} className={`raceIconAction ${me?.status==="interested"?"on":""}`} disabled={!!busy} onClick={()=>saveRace(r,"interested")}><Icon name="heart"/></button>
                    <button type="button" title="공유하기" aria-label="공유하기" className="raceIconAction" onClick={()=>shareRace(r)}><Icon name="share"/></button>
                  </>}
                  {!userId&&<button type="button" title="공유하기" aria-label="공유하기" className="raceIconAction" onClick={()=>shareRace(r)}><Icon name="share"/></button>}
                </div>

                {userId&&<div className="raceParticipationLine">
                  <button type="button" aria-pressed={me?.status==="applied"} className={me?.status==="applied"?"active":""} disabled={!!busy} onClick={()=>saveRace(r,me?.status==="applied"?"interested":"applied")}><span className="miniCheck">{me?.status==="applied"?"✓":""}</span>신청완료</button>
                  <button type="button" aria-pressed={me?.status==="going"} className={me?.status==="going"?"active":""} disabled={!!busy} onClick={()=>saveRace(r,me?.status==="going"?"interested":"going")}><span className="miniCheck">{me?.status==="going"?"✓":""}</span>참가예정</button>
                </div>}

                <div className="racePrimaryLinks">{r.registration_url&&<a href={r.registration_url} target="_blank" rel="noreferrer">Google Form 신청</a>}{r.official_url&&r.official_url!==r.registration_url&&<a href={r.official_url} target="_blank" rel="noreferrer">대회 정보</a>}</div>

                {userId&&me&&<div className="racePersonalRow racePersonalRowRefined">
                  {personalDistances.length>0&&<label className="raceDistanceSelect"><span>내 종목</span><select disabled={!!busy} value={normalizeDistance(me.distance)} onChange={e=>saveRace(r,me.status,e.target.value)}><option value="">선택</option>{personalDistances.map(d=><option key={d} value={d}>{d}</option>)}</select></label>}
                  <button className={`raceMiniAction ${editing?"on":""}`} type="button" aria-expanded={editing} onClick={()=>{setNoteOpen(editing?"":r.source_key);setNoteDraft(me.note||"")}}><Icon name="note"/><span>메모</span></button>
                  <button className="raceMiniAction danger" type="button" disabled={!!busy} onClick={()=>removeRace(r)}><Icon name="trash"/><span>기록 해제</span></button>
                </div>}

                {editing&&me&&<div className="raceNoteEditor"><textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} placeholder="집결 시간, 교통, 준비물 등을 메모하세요." maxLength={300}/><div><button className="btn ghost" type="button" onClick={()=>setNoteOpen("")}>취소</button><button className="btn" type="button" disabled={!!busy} onClick={async()=>{const ok=await saveRace(r,me.status,me.distance||undefined,noteDraft.trim());if(ok)setNoteOpen("")}}>{busy===r.source_key?"저장 중…":"메모 저장"}</button></div></div>}
              </div>
            </article>;
          })}
        </div>
      </section>)}
    </div>

    {actionMsg&&<p className="formStatus raceActionStatus" role="status" aria-live="polite">{actionMsg}</p>}
    {!loading&&!error&&!filtered.length&&<div className="card emptyState"><b>조건에 맞는 대회가 없어요.</b><p className="muted">검색어나 코스 필터를 바꿔보세요.</p></div>}
    <p className="raceSourceNote">Rung·김러닝·RUNFOR·마라톤모아와 승인된 러너 제보를 통합합니다. 실제 일정과 접수 여부는 신청 페이지에서 최종 확인해주세요.</p>
  </div>;
}
