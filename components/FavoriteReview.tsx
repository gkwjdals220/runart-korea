"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import TtwittunButtonIcon from "@/components/TtwittunButtonIcon";

export default function FavoriteReview({
 userId,courseId,initialFavorite,initialRating,initialBody
}:{userId:string;courseId:string;initialFavorite:boolean;initialRating:number|null;initialBody:string|null}){
 const [fav,setFav]=useState(initialFavorite);
 const [rating,setRating]=useState(initialRating||5);
 const [body,setBody]=useState(initialBody||"");
 const [msg,setMsg]=useState("");
 const [busy,setBusy]=useState<"favorite"|"review"|null>(null);

 async function toggleFavorite(){
  if(busy)return;
  setBusy("favorite");setMsg("");
  const sb=createClient();
  try{
   if(fav){
     const {error}=await sb.from("runart_favorites").delete().eq("user_id",userId).eq("course_id",courseId);
     if(error)throw error;setFav(false);setMsg("즐겨찾기에서 해제했습니다.");
   }else{
     const {error}=await sb.from("runart_favorites").insert({user_id:userId,course_id:courseId});
     if(error)throw error;setFav(true);setMsg("즐겨찾기에 저장했습니다.");
   }
  }catch(e:any){setMsg(e?.message||"즐겨찾기 변경 중 오류가 발생했습니다.")}finally{setBusy(null)}
 }

 async function saveReview(){
  if(busy)return;
  setBusy("review");setMsg("");
  const sb=createClient();
  try{
   const {data:existing,error:lookupError}=await sb.from("runart_reviews").select("id").eq("user_id",userId).eq("course_id",courseId).maybeSingle();
   if(lookupError)throw lookupError;
   const payload={user_id:userId,course_id:courseId,rating,body:body.trim()||null,updated_at:new Date().toISOString()};
   const result=existing
     ? await sb.from("runart_reviews").update(payload).eq("id",existing.id)
     : await sb.from("runart_reviews").insert(payload);
   if(result.error)throw result.error;setMsg("후기가 저장되었습니다.");
  }catch(e:any){setMsg(e?.message||"후기 저장 중 오류가 발생했습니다.")}finally{setBusy(null)}
 }

 return <div className="card favoriteReviewCard">
   <div className="favoriteReviewHead"><div><span className="eyebrow">RUNNER NOTE</span><h3>코스 후기</h3></div>
     <button type="button" disabled={!!busy} aria-pressed={fav} className={`btn ${fav?"pink":""}`} onClick={toggleFavorite}><TtwittunButtonIcon name="favorite" compact/>{busy==="favorite"?"변경 중…":fav?"저장됨":"즐겨찾기"}</button>
   </div>
   <div className="favoriteReviewFields"><label>별점
     <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
       {[5,4,3,2,1].map(x=><option key={x} value={x}>{"★".repeat(x)} ({x})</option>)}
     </select>
   </label>
   <label>후기<textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="노면, 조명, 신호 등 러닝 경험을 남겨주세요."/></label></div>
   <button className="btn reviewSaveButton" type="button" disabled={!!busy} onClick={saveReview}><TtwittunButtonIcon name="save" compact/>{busy==="review"?"저장 중…":"후기 저장"}</button>
   {msg&&<p className="muted formStatus" role="status" aria-live="polite">{msg}</p>}
 </div>
}
