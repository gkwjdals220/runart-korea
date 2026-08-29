"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Place={id:string;name:string;category:string;address?:string|null;distance_m?:number|null;walking_minutes?:number|null;editorial_note?:string|null;source_url?:string|null;verified?:boolean;curated?:boolean};

export default function NearbyPlaces({courseId,userId,initialFavoriteIds=[]}:{courseId:string;userId?:string|null;initialFavoriteIds?:string[]}){
 const [data,setData]=useState<{configured:boolean;curated:Place[];live:Place[]}|null>(null);const [tab,setTab]=useState<"restaurant"|"cafe">("restaurant");const [favorites,setFavorites]=useState(new Set(initialFavoriteIds));const [msg,setMsg]=useState("");
 useEffect(()=>{fetch(`/api/places/nearby?courseId=${courseId}`).then(r=>r.json()).then(setData).catch(()=>setData({configured:false,curated:[],live:[]}))},[courseId]);
 const places=useMemo(()=>{if(!data)return[];const seen=new Set<string>();return [...data.curated,...data.live].filter(p=>p.category===tab).filter(p=>{const k=`${p.name}|${p.address||""}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,10)},[data,tab]);
 async function toggle(p:Place){
  if(!userId)return setMsg("장소 찜은 로그인 후 사용할 수 있습니다.");
  if(p.id.startsWith("kakao:"))return setMsg("실시간 장소는 RUNART 장소 DB에 저장된 뒤 찜할 수 있습니다.");
  const sb=createClient();const next=new Set(favorites);
  if(next.has(p.id)){const {error}=await sb.from("runart_place_favorites").delete().eq("user_id",userId).eq("place_id",p.id);if(error)return setMsg(error.message);next.delete(p.id)}
  else{const {error}=await sb.from("runart_place_favorites").insert({user_id:userId,place_id:p.id});if(error)return setMsg(error.message);next.add(p.id)}
  setFavorites(next);setMsg("");
 }
 return <section className="section nearbySection"><div className="sectionHead"><div><span className="eyebrow">AFTER RUN</span><h2>뛰고 나서 어디 갈까?</h2><p className="muted">코스 중심 약 2km의 맛집·카페를 이어서 탐색합니다.</p></div><div className="segmented"><button className={tab==="restaurant"?"on":""} onClick={()=>setTab("restaurant")}>🍚 맛집</button><button className={tab==="cafe"?"on":""} onClick={()=>setTab("cafe")}>☕ 카페</button></div></div>
 {!data?<div className="card muted">주변 장소를 찾는 중...</div>:<div className="placeRail">{places.map(p=><article className="placeCard" key={p.id}><div className="placeBadge">{p.curated?"RUNART PICK":p.verified?"검증":"주변"}</div><h3>{p.name}</h3><p className="muted">{p.address||"주소 정보 없음"}</p><div className="metaRow"><span>{p.distance_m!=null?`${p.distance_m<1000?p.distance_m+"m":(p.distance_m/1000).toFixed(1)+"km"}`:"거리 미정"}</span>{p.walking_minutes&&<span>도보 {p.walking_minutes}분</span>}</div>{p.editorial_note&&<p className="placeNote">{p.editorial_note}</p>}<div className="actions"><button className={`heartBtn ${favorites.has(p.id)?"saved":""}`} onClick={()=>toggle(p)}>{favorites.has(p.id)?"♥ 찜함":"♡ 찜"}</button>{p.source_url&&<a className="btn ghost" href={p.source_url} target="_blank" rel="noreferrer">상세</a>}</div></article>)}{!places.length&&<div className="card muted">아직 연결된 {tab==="restaurant"?"맛집":"카페"}이 없습니다.{!data.configured&&" 장소 API 키를 연결하면 코스 주변을 자동 검색할 수 있습니다."}</div>}</div>}
 {msg&&<p className="muted">{msg}</p>}
 </section>
}
