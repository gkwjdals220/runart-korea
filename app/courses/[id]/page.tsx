import Link from "next/link";
import {notFound} from "next/navigation";
import Brand from "@/components/Brand";
import FavoriteReview from "@/components/FavoriteReview";
import NearbyPlaces from "@/components/NearbyPlaces";
import ParkingRecommendations from "@/components/ParkingRecommendations";
import RunnerReadySummary from "@/components/RunnerReadySummary";
import RunStartFlow from "@/components/RunStartFlow";
import {createClient} from "@/lib/supabase/server";

export default async function CoursePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:course}=await sb.from("runart_courses").select("*").eq("id",id).eq("status","approved").maybeSingle();
 if(!course)notFound();
 const {data:reviewRows}=await sb.from("runart_reviews").select("id,rating,body,created_at,user_id").eq("course_id",id).order("created_at",{ascending:false});
 const userIds=Array.from(new Set((reviewRows||[]).map((r:any)=>r.user_id)));
 const {data:profiles}=userIds.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",userIds):{data:[] as any[]};
 const profileMap=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const reviews=(reviewRows||[]).map((r:any)=>({...r,display_name:profileMap.get(r.user_id)||"러너"}));
 let fav=false,myRating:null|number=null,myBody:null|string=null,placeFavoriteIds:string[]=[];
 if(user){
   const {data:f}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id).eq("course_id",id).maybeSingle();fav=!!f;
   const {data:r}=await sb.from("runart_reviews").select("rating,body").eq("user_id",user.id).eq("course_id",id).maybeSingle();if(r){myRating=r.rating;myBody=r.body}
   const {data:pf}=await sb.from("runart_place_favorites").select("place_id").eq("user_id",user.id);placeFavoriteIds=(pf||[]).map((x:any)=>x.place_id);
 }
 const avg=(reviews||[]).length ? (reviews||[]).reduce((a,r)=>a+r.rating,0)/(reviews||[]).length : 0;
 return <main className="wrap">
   <header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/">← 코스 탐색</Link><Link className="btn ghost" href="/favorites">찜 목록</Link><Link className="btn" href="/dashboard">크루 기록</Link></div></header>
   <section className="detailHero card discoveryDetail"><div><span className="eyebrow">RUNART COURSE</span><div className="metaRow">{course.course_type==="art"&&<span className="tag">🎨 {course.art_shape}</span>}<span>{course.region} {course.city}</span>{course.verified&&<span className="tag">✓ 검증 코스</span>}</div><h1>{course.name}</h1><p className="muted">{Number(course.distance_km).toFixed(1)}km · 난이도 {"★".repeat(course.difficulty)}{course.start_name?` · ${course.start_name} 출발`:""}</p><div className="metaRow">{(course.tags||[]).slice(0,6).map((t:string)=><span className="tag" key={t}>#{t}</span>)}</div><div className="actions" style={{marginTop:14}}><a className="btn" href="#run-start">🏁 지금 출발하기</a><Link className="btn ghost" href={`/?course=${id}#explore`}>지도에서 보기</Link></div></div><div className="score"><b>{avg?avg.toFixed(1):"-"}</b><span>★ / 후기 {(reviews||[]).length}</span></div></section>
   <div className="stats section"><div className="stat"><b>{Number(course.distance_km).toFixed(1)}</b><span className="muted">km</span></div><div className="stat"><b>{course.traffic_lights??"-"}</b><span className="muted">신호등</span></div><div className="stat"><b>{course.toilets??"-"}</b><span className="muted">화장실</span></div><div className="stat"><b>{course.night_recommended?"GOOD":"-"}</b><span className="muted">야간 러닝</span></div></div>
   <RunStartFlow courseId={id} courseName={course.name} startName={course.start_name}/>
   <div className="grid2 section"><div className="card"><span className="eyebrow">ROUTE INFO</span><h3>코스 한눈에 보기</h3><div className="miniStats"><span><b>{course.surface||"-"}</b>노면</span><span><b>{course.elevation_gain_m??"-"}</b>상승고도(m)</span><span><b>{course.loop_type==="loop"?"순환":course.loop_type==="out_back"?"왕복":course.loop_type==="point_to_point"?"편도":"-"}</b>코스 형태</span></div><p className="muted" style={{marginTop:14}}>지도 메인 화면에서 실제 폴리라인과 함께 확인할 수 있습니다.</p><Link className="btn ghost" href={`/?course=${id}#explore`}>지도에서 보기</Link></div>{user?<FavoriteReview userId={user.id} courseId={id} initialFavorite={fav} initialRating={myRating} initialBody={myBody}/>:<div className="card"><h3>저장·후기</h3><p className="muted">로그인하면 코스를 찜하고 별점/후기를 남길 수 있습니다.</p><Link className="btn" href="/login">로그인</Link></div>}</div>
   <RunnerReadySummary courseId={id} fallbackToilets={course.toilets}/>
   <ParkingRecommendations courseId={id}/>
   <NearbyPlaces courseId={id} courseName={course.name} userId={user?.id||null} initialFavoriteIds={placeFavoriteIds}/>
   <section className="section"><div className="sectionHead"><div><span className="eyebrow">RUNNER REVIEW</span><h2>러너 후기</h2></div></div><div className="reviewGrid">{(reviews||[]).map((r:any)=><article className="card" key={r.id}><b>{"★".repeat(r.rating)}</b><p>{r.body||"내용 없음"}</p><small className="muted">{r.display_name} · {new Date(r.created_at).toLocaleDateString("ko-KR")}</small></article>)}{!(reviews||[]).length&&<div className="card muted">아직 후기가 없습니다.</div>}</div></section>
 </main>
}
