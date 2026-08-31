"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type ReviewSample={title:string;url:string;blogname?:string|null;datetime?:string|null};
type SortMode="runner"|"reviews"|"distance"|"popular";
type Place={id:string;saved_place_id?:string|null;name:string;category:string;address?:string|null;latitude?:number|null;longitude?:number|null;distance_m?:number|null;walking_minutes?:number|null;editorial_note?:string|null;source_url?:string|null;verified?:boolean;curated?:boolean;review_signal?:number|null;review_samples?:ReviewSample[];favorite_count?:number;plan_count?:number;runner_score?:number};
type NearbyData={configured:boolean;curated:Place[];live:Place[];radius_m?:number;ranking?:string;review_signal_note?:string;runner_score_note?:string};

export default function NearbyPlaces({courseId,courseName,userId,initialFavoriteIds=[]}:{courseId:string;courseName:string;userId?:string|null;initialFavoriteIds?:string[]}){
 const [data,setData]=useState<NearbyData|null>(null);
 const [tab,setTab]=useState<"restaurant"|"cafe">("restaurant");
 const [sort,setSort]=useState<SortMode>("runner");
 const [favorites,setFavorites]=useState(new Set(initialFavoriteIds));
 const [busy,setBusy]=useState<string|null>(null);
 const [msg,setMsg]=useState("");
 useEffect(()=>{fetch(`/api/places/nearby?courseId=${courseId}`).then(r=>r.json()).then(setData).catch(()=>setData({configured:false,curated:[],live:[]}))},[courseId]);
 const places=useMemo(()=>{if(!data)return[];const seen=new Set<string>();const rows=[...data.curated,...data.live].filter(p=>p.category===tab).filter(p=>{const k=`${p.name}|${p.address||""}`;if(seen.has(k))return false;seen.add(k);return true});rows.sort((a,b)=>{if(sort==="reviews")return Number(b.review_signal||0)-Number(a.review_signal||0)||Number(a.distance_m||99999)-Number(b.distance_m||99999);if(sort==="distance")return Number(a.distance_m||99999)-Number(b.distance_m||99999);if(sort==="popular")return Number(b.plan_count||0)-Number(a.plan_count||0)||Number(b.favorite_count||0)-Number(a.favorite_count||0)||Number(b.runner_score||0)-Number(a.runner_score||0);return Number(b.runner_score||0)-Number(a.runner_score||0)||Number(b.plan_count||0)-Number(a.plan_count||0)||Number(a.distance_m||99999)-Number(b.distance_m||99999)});return rows.slice(0,12)},[data,tab,sort]);
 function replacePlaceId(oldId:string,newId:string){setData(prev=>{if(!prev)return prev;const swap=(items:Place[])=>items.map(p=>p.id===oldId?{...p,id:newId,saved_place_id:newId}:p);return {...prev,curated:swap(prev.curated),live:swap(prev.live)}})}
 async function ensureSavedPlace(p:Place){
  if(!p.id.startsWith("kakao:"))return p.id;
  if(p.saved_place_id)return p.saved_place_id;
  if(!p.source_url||p.latitude==null||p.longitude==null)throw new Error("이 장소는 저장에 필요한 정보가 부족합니다.");
  const sb=createClient();
  const {data:savedId,error}=await sb.rpc("runart_save_kakao_place_favorite",{p_course_id:courseId,p_name:p.name,p_category:p.category,p_address:p.address||"",p_latitude:p.latitude,p_longitude:p.longitude,p_source_url:p.source_url,p_distance_m:p.distance_m==null?null:Math.round(p.distance_m)});
  if(error)throw error;
  const dbId=String(savedId||"");if(!dbId)throw new Error("장소 저장에 실패했습니다.");
  replacePlaceId(p.id,dbId);setFavorites(prev=>{const next=new Set(prev);next.add(dbId);return next});return dbId;
 }
 async function toggle(p:Place){
  if(!userId)return setMsg("장소 찜은 로그인 후 사용할 수 있습니다.");if(busy)return;setBusy(p.id);setMsg("");const sb=createClient();
  try{
   const targetId=p.saved_place_id||p.id;
   if(p.id.startsWith("kakao:")&&!p.saved_place_id){await ensureSavedPlace(p);setMsg(`${p.name}을(를) 찜 목록에 저장했습니다.`);return}
   const next=new Set(favorites);
   if(next.has(targetId)){const {error}=await sb.from("runart_place_favorites").delete().eq("user_id",userId).eq("place_id",targetId);if(error)throw error;next.delete(targetId);setMsg(`${p.name} 찜을 해제했습니다.`)}
   else{const {error}=await sb.from("runart_place_favorites").insert({user_id:userId,place_id:targetId});if(error)throw error;next.add(targetId);setMsg(`${p.name}을(를) 찜 목록에 저장했습니다.`)}setFavorites(next);
  }catch(e:any){setMsg(e?.message||"저장 중 오류가 발생했습니다.")}finally{setBusy(null)}
 }
 async function savePlan(p:Place){
  if(!userId)return setMsg("RUN + EAT 일정 저장은 로그인 후 사용할 수 있습니다.");if(busy)return;setBusy(`plan:${p.id}`);setMsg("");const sb=createClient();
  try{
   const placeId=await ensureSavedPlace(p);
   const title=`${courseName} + ${p.name}`;
   const {data:plan,error}=await sb.from("runart_run_eat_plans").upsert({user_id:userId,course_id:courseId,place_id:placeId,title,is_public:true},{onConflict:"user_id,course_id,place_id"}).select("id").single();
   if(error)throw error;
   const shareUrl=`${window.location.origin}/plans/${plan.id}`;
   if(navigator.share){try{await navigator.share({title:`TTWITTUN · ${title}`,text:"러닝 코스와 러닝 후 장소를 함께 저장한 RUN + EAT 일정입니다.",url:shareUrl});setMsg("RUN + EAT 일정을 저장하고 공유했습니다.");return}catch(e:any){if(e?.name!=="AbortError")throw e}}
   await navigator.clipboard.writeText(shareUrl);setMsg("RUN + EAT 일정을 저장했습니다. 공유 링크도 복사했어요.");
  }catch(e:any){setMsg(e?.message||"RUN + EAT 일정 저장 중 오류가 발생했습니다.")}finally{setBusy(null)}
 }
 return <section className="section nearbySection" id="after-run">
  <div className="sectionHead"><div><span className="eyebrow">AFTER RUN</span><h2>뛰고 나서 어디 갈까?</h2><p className="muted">코스 중심 최대 5km에서 후기와 TTWITTUN 러너 행동을 함께 반영해 추천합니다.</p></div><div className="segmented"><button className={tab==="restaurant"?"on":""} onClick={()=>setTab("restaurant")}>🍚 맛집</button><button className={tab==="cafe"?"on":""} onClick={()=>setTab("cafe")}>☕ 카페</button></div></div>
  {!data?<div className="card muted">주변 장소를 찾는 중...</div>:<><div className="nearbyTrustNote"><b>TTWITTUN 러너 점수</b><span>직접 추천 · 찜 · RUN + EAT 저장 · 외부 후기 · 거리</span><small>{data.runner_score_note||data.review_signal_note||"러너 행동 데이터가 쌓일수록 TTWITTUN 내부 신호의 비중이 커집니다."}</small></div><div className="nearbySortBar" aria-label="맛집 정렬"><button className={sort==="runner"?"on":""} onClick={()=>setSort("runner")}>🏃 러너 추천</button><button className={sort==="popular"?"on":""} onClick={()=>setSort("popular")}>🔥 러닝 후 인기</button><button className={sort==="reviews"?"on":""} onClick={()=>setSort("reviews")}>💬 후기 많은 순</button><button className={sort==="distance"?"on":""} onClick={()=>setSort("distance")}>📍 가까운 순</button></div><div className="placeRail">{places.map((p,i)=>{const favoriteKey=p.saved_place_id||p.id;return <article className="placeCard runnerPlaceCard" key={`${p.id}-${i}`}><div className="placeCardTop"><div className="placeBadge">{p.curated?"TTWITTUN PICK":Number(p.runner_score||0)>=30?"RUNNER PICK":p.review_signal&&p.review_signal>0?"USER SIGNAL":p.verified?"검증":"주변"}</div>{p.runner_score!=null&&<div className="runnerScore"><b>{p.runner_score}</b><span>러너점수</span></div>}</div><h3>{p.name}</h3><p className="muted">{p.address||"주소 정보 없음"}</p><div className="metaRow"><span>{p.distance_m!=null?`${p.distance_m<1000?p.distance_m+"m":(p.distance_m/1000).toFixed(1)+"km"}`:"거리 미정"}</span>{p.walking_minutes&&<span>도보 {p.walking_minutes}분</span>}{p.review_signal!=null&&p.review_signal>0&&<span>후기 신호 {p.review_signal.toLocaleString()}+</span>}</div>{(Number(p.favorite_count||0)>0||Number(p.plan_count||0)>0)&&<div className="runnerSignals">{Number(p.favorite_count||0)>0&&<span>♥ 러너 찜 {p.favorite_count}</span>}{Number(p.plan_count||0)>0&&<span>🍽 RUN + EAT {p.plan_count}</span>}</div>}{p.editorial_note&&<p className="placeNote">{p.editorial_note}</p>}{p.review_samples&&p.review_samples.length>0&&<div className="reviewSignalBox"><b>실사용 후기 참고</b>{p.review_samples.slice(0,2).map((r,j)=><a key={`${r.url}-${j}`} href={r.url} target="_blank" rel="noreferrer"><span>{r.title}</span><small>{r.blogname||"블로그 후기"}</small></a>)}</div>}<div className="actions"><button disabled={!!busy} className={`heartBtn ${favorites.has(favoriteKey)?"saved":""}`} onClick={()=>toggle(p)}>{busy===p.id?"저장 중…":favorites.has(favoriteKey)?"♥ 찜함":"♡ 찜"}</button><button disabled={!!busy} className="btn" onClick={()=>savePlan(p)}>{busy===`plan:${p.id}`?"일정 저장 중…":"RUN + EAT 저장"}</button>{p.source_url&&<a className="btn ghost" href={p.source_url} target="_blank" rel="noreferrer">지도 상세</a>}</div></article>})}{!places.length&&<div className="card muted">아직 연결된 {tab==="restaurant"?"맛집":"카페"}이 없습니다.{!data.configured&&" 장소 API 키를 연결하면 코스 주변을 자동 검색할 수 있습니다."}</div>}</div></>}
  {msg&&<p className="muted">{msg}</p>}
 </section>;
}
