import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import {createClient} from "@/lib/supabase/server";

export default async function ExplorePage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:courses}=await sb.from("runart_courses").select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality").eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 let favoriteIds:string[]=[];
 if(user){const {data:favs}=await sb.from("runart_favorites").select("course_id").eq("user_id",user.id);favoriteIds=(favs||[]).map((x:any)=>x.course_id)}
 return <main className="wrap explorePage standaloneExplorePage">
  <header className="top simpleTop"><Brand/><div className="nav"><Link className="btn ghost" href="/">← 홈</Link><Link className="btn" href="/run/free">🏃 RUN</Link></div></header>
  <section className="explorePageHero"><div><span className="eyebrow">COURSE EXPLORE</span><h1>오늘 달릴 코스 찾기</h1><p className="muted">검색 · 지도 · 필터 · 출발 준비를 이 페이지에서 끝내세요.</p></div><Link className="btn" href="/run/free">코스 없이 바로 RUN</Link></section>
  <CourseExplorer courses={normalized as any} userId={user?.id||null} favoriteIds={favoriteIds}/>
 </main>;
}
