"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function RaceSubmissionForm({userId}:{userId:string}){
 const[url,setUrl]=useState(""),[name,setName]=useState(""),[date,setDate]=useState(""),[region,setRegion]=useState(""),[note,setNote]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");const sb=createClient();const {error}=await sb.from("runart_public_race_submissions").insert({user_id:userId,source_url:url.trim(),race_name:name.trim()||null,race_date:date||null,region:region.trim()||null,note:note.trim()||null});setBusy(false);if(error){setMsg("제보 저장에 실패했어요. 잠시 후 다시 시도해주세요.");return}setMsg("제보를 저장했어요. 확인 후 대회 일정에 반영할게요.");setUrl("");setName("");setDate("");setRegion("");setNote("")}
 return <form className="card raceSubmitForm" onSubmit={submit}><label>신청/안내 링크<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://forms.gle/... 또는 대회 안내 페이지"/></label><div className="raceSubmitGrid"><label>대회명<input value={name} onChange={e=>setName(e.target.value)} placeholder="알고 있다면 입력"/></label><label>대회일<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><label>지역<input value={region} onChange={e=>setRegion(e.target.value)} placeholder="서울, 경기, 부산 등"/></label><label>메모<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="종목, 접수 마감, 인스타 공지 등 추가 정보"/></label><button className="btn" disabled={busy}>{busy?"저장 중…":"대회 제보하기"}</button>{msg&&<p className="muted">{msg}</p>}</form>
}
