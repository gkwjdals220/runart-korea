import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function ManageMembers(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);const membership=mem?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role;if(!crewId||!["owner","admin"].includes(role||""))redirect("/dashboard");
 const {data:members}=await sb.from("runart_crew_members").select("user_id,role,joined_at").eq("crew_id",crewId).order("joined_at");const ids=(members||[]).map((x:any)=>x.user_id);const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name").in("user_id",ids):{data:[] as any[]};const names=new Map((profiles||[]).map((p:any)=>[p.user_id,p.display_name]));
 const {data:logs}=await sb.from("runart_course_logs").select("id,run_date,actual_distance_km,course_id,runart_courses(distance_km)").eq("crew_id",crewId);const logIds=(logs||[]).map((x:any)=>x.id);const {data:parts}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};const logMap=new Map((logs||[]).map((x:any)=>[x.id,x]));
 const stats=new Map<string,{count:number;km:number,last:string|null}>();for(const id of ids)stats.set(id,{count:0,km:0,last:null});for(const p of parts||[]){const l:any=logMap.get((p as any).log_id);if(!l)continue;const s=stats.get((p as any).user_id)||{count:0,km:0,last:null};s.count++;s.km+=Number(l.actual_distance_km||l.runart_courses?.distance_km||0);if(!s.last||l.run_date>s.last)s.last=l.run_date;stats.set((p as any).user_id,s)}
 return <main className="wrap mobileSubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/manage">← 운영센터</Link></header><section className="compactPageHero"><span className="eyebrow">CREW MEMBERS</span><h1>크루원</h1><p className="muted">멤버별 참여와 누적 거리를 빠르게 확인합니다.</p></section><div className="mobileCardList">{(members||[]).map((m:any)=>{const s=stats.get(m.user_id)||{count:0,km:0,last:null};return <article className="card mobileListCard" key={m.user_id}><div><small>{m.role}</small><h3>{names.get(m.user_id)||"러너"}</h3><p>{s.count}회 · {s.km.toFixed(1)}km · 최근 {s.last||"없음"}</p></div></article>})}</div></main>;
}
