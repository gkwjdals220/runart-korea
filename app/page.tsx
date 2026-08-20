import Link from "next/link";
import Brand from "@/components/Brand";
import CourseExplorer from "@/components/CourseExplorer";
import {createClient} from "@/lib/supabase/server";

export default async function Home(){
 const sb=await createClient();
 const {data:courses}=await sb.from("runart_courses")
  .select("id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson")
  .eq("status","approved").order("name");

 const normalized=(courses||[]).map(c=>({...c,distance_km:Number(c.distance_km)}));
 const art=normalized.filter(c=>c.course_type==="art").length;

 return <main className="wrap">
  <header className="top"><Brand/><div className="nav">
   <Link className="btn ghost" href="/favorites">즐겨찾기</Link>
   <Link className="btn ghost" href="/submit">코스 제보</Link>
   <Link className="btn" href="/dashboard">뛰뚠뛰뚠</Link>
  </div></header>

  <section className="hero compact">
   <div><span className="eyebrow">RUN EVERYWHERE · DRAW SOMETHING</span>
   <h1>대한민국 러닝 코스를<br/>한 지도에.</h1>
   <p className="muted">일반 코스부터 붕어빵런 같은 GPS 아트까지. 찾고, 저장하고, 달리고, 기록하세요.</p></div>
   <div className="heroStats"><b>{normalized.length}</b><span>코스</span><b>{art}</b><span>그리기 런</span></div>
  </section>

  <CourseExplorer courses={normalized as any}/>
 </main>
}
