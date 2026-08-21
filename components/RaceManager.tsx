"use client";
import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Race={id:string;name:string;race_date:string|null;region:string|null;venue:string|null;registration_deadline:string|null;registration_status:string;distance_options:string[];official_url:string|null;memo:string|null};
type Participation={race_id:string;user_id:string;status:string;distance:string|null;note:string|null};
type Member={user_id:string;display_name:string;role:string};

export default function RaceManager({userId,crewId,role,races,participations,members}:{userId:string;crewId:string;role:string;races:Race[];participations:Participation[];members:Member[]}){
 const admin=["owner","admin"].includes(role);const [msg,setMsg]=useState("");
 const [name,setName]=useState("");const [date,setDate]=useState("");const [region,setRegion]=useState("");const [venue,setVenue]=useState("");const [deadline,setDeadline]=useState("");const [distances,setDistances]=useState("10K");const [url,setUrl]=useState("");const [memo,setMemo]=useState("");
 const mine=useMemo(()=>new Map(participations.filter(p=>p.user_id===userId).map(p=>[p.race_id,p])),[participations,userId]);
 async function createRace(){
  if(!name.trim())return setMsg("대회명을 입력해주세요.");const sb=createClient();
  const {error}=await sb.from("runart_races").insert({crew_id:crewId,created_by:userId,name:name.trim(),race_date:date||null,region:region||null,venue:venue||null,registration_deadline:deadline||null,registration_status:"unknown",distance_options:distances.split(",").map(x=>x.trim()).filter(Boolean),official_url:url||null,memo:memo||null});
  if(error)return setMsg(error.message);location.reload();
 }
 async function setParticipation(raceId:string,status:string,distance?:string){
  const sb=createClient();const current=mine.get(raceId);
  const {error}=await sb.from("runart_race_participation").upsert({race_id:raceId,user_id:userId,status,distance:distance||current?.distance||null,updated_at:new Date().toISOString()},{onConflict:"race_id,user_id"});
  if(error)return setMsg(error.message);location.reload();
 }
 async function deleteRace(id:string){if(!confirm("이 대회를 삭제할까요?"))return;const sb=createClient();const {error}=await sb.from("runart_races").delete().eq("id",id);if(error)return setMsg(error.message);location.reload()}
 return <div className="stack">
  {admin&&<div className="card"><h3>대회 등록</h3><div className="formgrid"><label>대회명<input value={name} onChange={e=>setName(e.target.value)}/></label><label>대회일<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>지역<input value={region} onChange={e=>setRegion(e.target.value)}/></label><label>장소<input value={venue} onChange={e=>setVenue(e.target.value)}/></label><label>접수 마감<input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label><label>종목/거리<input value={distances} onChange={e=>setDistances(e.target.value)} placeholder="10K, Half, Full"/></label></div><label>공식 링크<input value={url} onChange={e=>setUrl(e.target.value)}/></label><label>메모<textarea value={memo} onChange={e=>setMemo(e.target.value)}/></label><button className="btn" onClick={createRace}>대회 등록</button></div>}
  {races.map(r=>{const ps=participations.filter(p=>p.race_id===r.id);const me=mine.get(r.id);const going=ps.filter(p=>p.status==="going");return <article className="card" key={r.id}><div className="courseTop"><div><h3>{r.name}</h3><p className="muted">{r.race_date||"날짜 미정"} · {r.region||"지역 미정"} {r.venue||""}</p></div><b>👥 {going.length}</b></div><div className="metaRow"><span>접수: {r.registration_status}</span><span>마감: {r.registration_deadline||"미정"}</span>{r.distance_options?.map(d=><span className="tag" key={d}>{d}</span>)}</div><div className="actions"><button className={`btn ${me?.status==="going"?"":"ghost"}`} onClick={()=>setParticipation(r.id,"going")}>참가</button><button className={`btn ${me?.status==="maybe"?"":"ghost"}`} onClick={()=>setParticipation(r.id,"maybe")}>미정</button><button className={`btn ${me?.status==="not_going"?"":"ghost"}`} onClick={()=>setParticipation(r.id,"not_going")}>불참</button>{r.official_url&&<a className="btn ghost" href={r.official_url} target="_blank" rel="noreferrer">공식 페이지</a>}{admin&&<button className="btn danger" onClick={()=>deleteRace(r.id)}>삭제</button>}</div>{me?.status==="going"&&r.distance_options?.length>0&&<label>내 참가 종목<select value={me.distance||""} onChange={e=>setParticipation(r.id,"going",e.target.value)}><option value="">선택</option>{r.distance_options.map(d=><option key={d}>{d}</option>)}</select></label>}<p className="muted">참가: {going.map(p=>members.find(m=>m.user_id===p.user_id)?.display_name||"러너").join(", ")||"아직 없음"}</p>{r.memo&&<p>{r.memo}</p>}</article>})}
  {!races.length&&<div className="card muted">등록된 대회가 없습니다.</div>}{msg&&<p className="muted">{msg}</p>}
 </div>
}
