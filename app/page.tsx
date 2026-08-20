import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import {createClient} from "@/lib/supabase/server";

export default async function Home(){
 const sb=await createClient();
 const {data:courses}=await sb.from("runart_courses")
  .select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality")
  .eq("status","approved").order("name");
 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 const art=normalized.filter(c=>c.course_type==="art").length;const verified=normalized.filter(c=>c.verified).length;
 return <main className="wrap"><header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/art">그리기 런</Link><Link className="btn ghost" href="/favorites">즐겨찾기</Link><Link className="btn ghost" href="/submit">코스 제보</Link><Link className="btn" href="/dashboard">뛰뚠뛰뚠</Link></div></header>
 <section className="hero compact"><div><span className="eyebrow">RUNART KOREA · NATIONAL COURSE CATALOG</span><h1>대한민국 러닝 코스를<br/>한 지도에.</h1><p className="muted">지역·거리·노면·코스형태·검증여부까지 골라 찾고, GPS 아트는 별도 도감으로 모읍니다.</p></div><div className="heroStats"><b>{normalized.length}</b><span>등록 코스</span><b>{art}</b><span>그리기 런</span><b>{verified}</b><span>검증 코스</span></div></section>
 <CourseExplorer courses={normalized as any}/></main>
}
