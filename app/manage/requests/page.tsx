import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import JoinRequestActions from "@/components/JoinRequestActions";
import {createClient} from "@/lib/supabase/server";

export default async function ManageRequests(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);const membership=mem?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role;if(!crewId||!["owner","admin"].includes(role||""))redirect("/dashboard");
 const {data:reqs}=await sb.from("runart_crew_join_requests").select("id,user_id,message,status,created_at").eq("crew_id",crewId).eq("status","pending").order("created_at");const ids=Array.from(new Set((reqs||[]).map((x:any)=>x.user_id)));const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/manage">← 운영센터</Link></header><section className="compactPageHero"><span className="eyebrow">JOIN REQUESTS</span><h1>가입 신청</h1><p className="muted">승인이 필요한 신청만 모아서 처리합니다.</p></section><div className="mobileCardList">{(reqs||[]).map((x:any)=><article className="card mobileListCard mobileListAction" key={x.id}><div><small>{new Date(x.created_at).toLocaleDateString("ko-KR")}</small><h3>{names.get(x.user_id)||"신규 러너"}</h3><p>{x.message||"가입 메시지 없음"}</p></div><JoinRequestActions requestId={x.id}/></article>)}{!(reqs||[]).length&&<div className="card emptyState"><b>대기 중인 가입 신청이 없습니다.</b></div>}</div></main>;
}
