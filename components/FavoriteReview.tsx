"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function FavoriteReview({
 userId,courseId,initialFavorite,initialRating,initialBody
}:{userId:string;courseId:string;initialFavorite:boolean;initialRating:number|null;initialBody:string|null}){
 const [fav,setFav]=useState(initialFavorite);
 const [rating,setRating]=useState(initialRating||5);
 const [body,setBody]=useState(initialBody||"");
 const [msg,setMsg]=useState("");

 async function toggleFavorite(){
  const sb=createClient();
  if(fav){
    const {error}=await sb.from("runart_favorites").delete().eq("user_id",userId).eq("course_id",courseId);
    if(error)return setMsg(error.message); setFav(false);
  }else{
    const {error}=await sb.from("runart_favorites").insert({user_id:userId,course_id:courseId});
    if(error)return setMsg(error.message); setFav(true);
  }
 }

 async function saveReview(){
  const sb=createClient();
  const {data:existing}=await sb.from("runart_reviews").select("id").eq("user_id",userId).eq("course_id",courseId).maybeSingle();
  const payload={user_id:userId,course_id:courseId,rating,body:body.trim()||null,updated_at:new Date().toISOString()};
  const result=existing
    ? await sb.from("runart_reviews").update(payload).eq("id",existing.id)
    : await sb.from("runart_reviews").insert(payload);
  setMsg(result.error?result.error.message:"후기가 저장되었습니다.");
 }

 return <div className="card">
   <div className="actions">
     <button className={`btn ${fav?"pink":""}`} onClick={toggleFavorite}>{fav?"♥ 즐겨찾기 완료":"♡ 즐겨찾기"}</button>
   </div>
   <h3>코스 후기</h3>
   <label>별점
     <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
       {[5,4,3,2,1].map(x=><option key={x} value={x}>{"★".repeat(x)} ({x})</option>)}
     </select>
   </label>
   <label>후기<textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="신호, 야간 조명, 노면, 재미 등을 남겨주세요."/></label>
   <button className="btn" onClick={saveReview}>후기 저장</button>
   {msg&&<p className="muted">{msg}</p>}
 </div>
}
