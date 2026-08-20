import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import ModerationButtons from "@/components/ModerationButtons";
import LogoutButton from "@/components/LogoutButton";
import {createClient} from "@/lib/supabase/server";

export default async function Manage(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:ownedCrew}=await sb.from("runart_crews").select("id,name,slug").eq("owner_id",user.id).maybeSingle();
 const {data:memberships}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=memberships?.[0];
 const role=ownedCrew?"owner":membership?.role;
 const admin=["owner","admin"].includes(role||"");
 const {data:pending}=admin?await sb.from("runart_courses")
   .select("id,name,region,city,course_type,art_shape,distance_km,status,source_name,created_at")
   .eq("status","pending").order("created_at",{ascending:false}):{data:[] as any[]};

 return <main className="wrap">
  <header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/dashboard">대시보드</Link><Link className="btn ghost" href="/">지도</Link><LogoutButton/></div></header>
  <section className="hero compact"><h1>운영 센터</h1><p className="muted">코스 제보를 검수하고 공개 여부를 결정합니다.</p></section>
  <div className="card"><b>현재 권한: {role||"크루 미가입"}</b>{ownedCrew&&<span className="muted"> · {ownedCrew.name}</span>}</div>
  <section className="section"><h2>승인 대기 코스</h2>
   {!admin?<div className="card muted">owner/admin 권한이 필요합니다.</div>:
    (pending||[]).length?(pending||[]).map((x:any)=><article className="card moderationCard" key={x.id}>
      <div><h3>{x.name}</h3><p className="muted">{x.region} {x.city} · {Number(x.distance_km).toFixed(1)}km · {x.course_type}{x.art_shape?` · ${x.art_shape}`:""}</p><span className="tag">pending</span></div>
      <ModerationButtons courseId={x.id}/>
    </article>):<div className="card muted">승인 대기 코스가 없습니다.</div>}
  </section>
 </main>
}
