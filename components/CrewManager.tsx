"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
export default function CrewManager({userId}:{userId:string}){
 const [name,setName]=useState("뛰뚠뛰뚠"); const [slug,setSlug]=useState("ttunttun"); const [msg,setMsg]=useState("");
 async function createCrew(){
  const sb=createClient();
  const clean=slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,"-");
  const {data,error}=await sb.from("runart_crews").insert({name:name.trim(),slug:clean,owner_id:userId,is_public:true}).select("id").single();
  if(error)return setMsg(error.message);
  const {error:memberError}=await sb.from("runart_crew_members").insert({crew_id:data.id,user_id:userId,role:"owner"});
  if(memberError)return setMsg("크루는 생성됐지만 멤버 연결 실패: "+memberError.message);
  setMsg("크루 생성 완료. 대시보드를 새로고침해주세요.");
 }
 return <div className="card"><h3>크루 생성</h3><p className="muted">최초 한 번만 생성하면 이후 공용 수행 일지가 활성화됩니다.</p>
  <label>크루명<input value={name} onChange={e=>setName(e.target.value)}/></label>
  <label>주소용 영문 slug<input value={slug} onChange={e=>setSlug(e.target.value)}/></label>
  <button className="btn" onClick={createCrew}>뛰뚠뛰뚠 크루 만들기</button>{msg&&<p className="muted">{msg}</p>}
 </div>
}