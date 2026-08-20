import Link from "next/link";
import {notFound} from "next/navigation";
import Brand from "@/components/Brand";
import FavoriteReview from "@/components/FavoriteReview";
import {createClient} from "@/lib/supabase/server";

export default async function CoursePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:course}=await sb.from("runart_courses").select("*").eq("id",id).eq("status","approved").maybeSingle();
 if(!course)notFound();

 const {data:reviewRows}=await sb.from("runart_reviews")
  .select("id,rating,body,created_at,user_id")
  .eq("course_id",id).order("created_at",{ascending:false});
 const userIds=Array.from(new Set((reviewRows||[]).map((r:any)=>r.user_id)));
 const {data:profiles}=userIds.length
   ? await sb.from("runart_profiles").select("user_id,display_name").in("user_id",userIds)
   : {data:[] as any[]};
 const profileMap=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const reviews=(reviewRows||[]).map((r:any)=>({...r,display_name:profileMap.get(r.user_id)||"러너"}));

 let fav=false,myRating:null|number=null,myBody:null|string=null;
 if(user){
   const {data:f}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id).eq("course_id",id).maybeSingle();
   fav=!!f;
   const {data:r}=await sb.from("runart_reviews").select("rating,body").eq("user_id",user.id).eq("course_id",id).maybeSingle();
   if(r){myRating=r.rating;myBody=r.body}
 }
 const avg=(reviews||[]).length ? (reviews||[]).reduce((a,r)=>a+r.rating,0)/(reviews||[]).length : 0;

 return <main className="wrap">
   <header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/">← 전국 지도</Link><Link className="btn" href="/dashboard">크루 기록</Link></div></header>
   <section className="detailHero card">
     <div><div className="metaRow">{course.course_type==="art"&&<span className="tag">🎨 {course.art_shape}</span>}<span>{course.region} {course.city}</span></div>
     <h1>{course.name}</h1><p className="muted">{Number(course.distance_km).toFixed(1)}km · 난이도 {"★".repeat(course.difficulty)}</p></div>
     <div className="score"><b>{avg?avg.toFixed(1):"-"}</b><span>★ / 후기 {(reviews||[]).length}</span></div>
   </section>
   <div className="stats section">
     <div className="stat"><b>{Number(course.distance_km).toFixed(1)}</b><span className="muted">km</span></div>
     <div className="stat"><b>{course.traffic_lights??"-"}</b><span className="muted">신호등</span></div>
     <div className="stat"><b>{course.toilets??"-"}</b><span className="muted">화장실</span></div>
     <div className="stat"><b>{course.night_recommended?"GOOD":"-"}</b><span className="muted">야간 러닝</span></div>
   </div>
   <div className="grid2 section">
     <div className="card"><h3>코스 데이터</h3><pre className="routePreview">{JSON.stringify(course.route_geojson,null,2)}</pre>
     <p className="muted">v6 지도 메인 화면에서 실제 폴리라인으로 확인할 수 있습니다.</p></div>
     {user?<FavoriteReview userId={user.id} courseId={id} initialFavorite={fav} initialRating={myRating} initialBody={myBody}/>:<div className="card"><h3>저장·후기</h3><p className="muted">로그인하면 즐겨찾기와 별점/후기를 사용할 수 있습니다.</p><Link className="btn" href="/login">로그인</Link></div>}
   </div>
   <section className="section"><h2>러너 후기</h2><div className="reviewGrid">
    {(reviews||[]).map((r:any)=><article className="card" key={r.id}><b>{"★".repeat(r.rating)}</b><p>{r.body||"내용 없음"}</p><small className="muted">{r.display_name} · {new Date(r.created_at).toLocaleDateString("ko-KR")}</small></article>)}
    {!(reviews||[]).length&&<div className="card muted">아직 후기가 없습니다.</div>}
   </div></section>
 </main>
}
