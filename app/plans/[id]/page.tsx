import Link from "next/link";
import {notFound} from "next/navigation";
import Brand from "@/components/Brand";
import SharePlanButton from "@/components/SharePlanButton";
import TtwittunButtonIcon from "@/components/TtwittunButtonIcon";
import {createClient} from "@/lib/supabase/server";

export default async function RunEatPlanPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:plan}=await sb.from("runart_run_eat_plans").select("id,title,note,is_public,created_at,user_id,runart_courses(id,name,region,city,distance_km,difficulty,start_name,course_type,art_shape),runart_places(id,name,category,address,source_url)").eq("id",id).maybeSingle();
 if(!plan)notFound();
 const course:any=(plan as any).runart_courses;
 const place:any=(plan as any).runart_places;
 return <main className="wrap detailPage ttwittunDetailPage planDetailPage">
  <header className="top detailTop"><Brand/><div className="nav"><Link className="btn ghost" href="/explore"><TtwittunButtonIcon name="back" compact/>코스 탐색</Link><Link className="btn ghost" href="/favorites"><TtwittunButtonIcon name="favorite" compact/>내 찜</Link></div></header>
  <section className="hero compact detailHero card discoveryDetail"><div><span className="eyebrow">RUN + EAT</span><h1>{plan.title}</h1><p className="muted">달리고, 먹고, 하루 코스를 한 번에 공유하세요.</p></div><SharePlanButton title={plan.title}/></section>
  <section className="section grid2 planSteps">
   <article className="card"><span className="eyebrow">STEP 1 · RUN</span><h2>{course?.name}</h2><p className="muted">{course?.region} {course?.city} · {Number(course?.distance_km||0).toFixed(1)}km{course?.start_name?` · ${course.start_name} 출발`:""}</p>{course?.course_type==="art"&&<span className="tag">🎨 {course?.art_shape}</span>}<div className="actions" style={{marginTop:16}}><Link className="btn" href={`/courses/${course?.id}`}><TtwittunButtonIcon name="run"/>코스 상세</Link><Link className="btn ghost" href={`/?course=${course?.id}#explore`}><TtwittunButtonIcon name="map"/>지도에서 보기</Link></div></article>
   <article className="card"><span className="eyebrow">STEP 2 · EAT</span><h2>{place?.category==="cafe"?"☕":"🍚"} {place?.name}</h2><p className="muted">{place?.address||"주소 정보 없음"}</p>{place?.source_url&&<div className="actions" style={{marginTop:16}}><a className="btn" href={place.source_url} target="_blank" rel="noreferrer"><TtwittunButtonIcon name="food"/>카카오맵 상세</a></div>}</article>
  </section>
  {plan.note&&<section className="section card"><span className="eyebrow">MEMO</span><p>{plan.note}</p></section>}
  <section className="section card planNextAction"><h3>이 조합으로 달려볼까요?</h3><p className="muted">코스를 확인한 뒤 바로 러닝을 시작하고, 완주 후 저장한 장소로 이어가세요.</p><Link className="btn" href={`/courses/${course?.id}`}><TtwittunButtonIcon name="run"/>코스 출발 준비 보기</Link></section>
  <div className="mobilePrimaryBar"><Link className="btn ghost" href={`/explore?course=${course?.id}`}><TtwittunButtonIcon name="map" compact/>지도</Link><Link className="btn" href={`/courses/${course?.id}`}><TtwittunButtonIcon name="run" compact/>출발 준비</Link></div>
 </main>
}
