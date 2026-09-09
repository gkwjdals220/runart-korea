import {redirect} from "next/navigation";
import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const revalidate=0;

function roleName(role?:string|null){return role==="owner"?"크루장":role==="admin"?"운영진":"크루원"}
function pbName(flag:string){return flag==="LONGEST"?"최장거리":flag}

export default async function ManageMembers(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const {data:owned}=await sb.from("runart_crews").select("id").eq("owner_id",user.id).maybeSingle();
 const {data:mem}=await sb.from("runart_crew_members").select("crew_id,role").eq("user_id",user.id);
 const membership=mem?.[0],crewId=owned?.id||membership?.crew_id,role=owned?"owner":membership?.role;
 if(!crewId)redirect("/dashboard");
 const canManage=["owner","admin"].includes(role||"");
 const [{data:members},{data:pbRows}]=await Promise.all([
  sb.from("runart_crew_members").select("user_id,role,joined_at").eq("crew_id",crewId).order("joined_at"),
  sb.rpc("runart_crew_member_pb_summary",{p_crew_id:crewId})
 ]);
 const ids=(members||[]).map((x:any)=>x.user_id);
 const {data:profiles}=ids.length?await sb.from("runart_profiles").select("user_id,display_name,avatar_path,updated_at").in("user_id",ids):{data:[] as any[]};
 const profileMap=new Map((profiles||[]).map((p:any)=>[p.user_id,p]));
 const pbMap=new Map((pbRows||[]).map((p:any)=>[p.user_id,Array.isArray(p.pb_flags)?p.pb_flags:[]]));
 const avatarEntries=await Promise.all((profiles||[]).map(async(p:any)=>{
  if(!p.avatar_path)return [p.user_id,null] as const;
  const {data}=await sb.storage.from("runart-media").createSignedUrl(p.avatar_path,900);
  if(!data?.signedUrl)return [p.user_id,null] as const;
  const version=p.updated_at?new Date(p.updated_at).getTime():Date.now();
  const separator=data.signedUrl.includes("?")?"&":"?";
  return [p.user_id,`${data.signedUrl}${separator}v=${version}`] as const;
 }));
 const avatarMap=new Map(avatarEntries);
 const {data:logs}=await sb.from("runart_course_logs").select("id,run_date,actual_distance_km,course_id,runart_courses(distance_km)").eq("crew_id",crewId);
 const logIds=(logs||[]).map((x:any)=>x.id);
 const {data:parts}=logIds.length?await sb.from("runart_log_participants").select("log_id,user_id").in("log_id",logIds):{data:[] as any[]};
 const logMap=new Map((logs||[]).map((x:any)=>[x.id,x]));
 const stats=new Map<string,{count:number;km:number;last:string|null}>();
 for(const id of ids)stats.set(id,{count:0,km:0,last:null});
 for(const p of parts||[]){const l:any=logMap.get((p as any).log_id);if(!l)continue;const s=stats.get((p as any).user_id)||{count:0,km:0,last:null};s.count++;s.km+=Number(l.actual_distance_km||l.runart_courses?.distance_km||0);if(!s.last||l.run_date>s.last)s.last=l.run_date;stats.set((p as any).user_id,s)}
 return <main className="wrap mobileSubPage crewMembersPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href={canManage?"/manage":"/dashboard"}>← {canManage?"운영센터":"크루"}</Link></header><section className="compactPageHero"><span className="eyebrow">CREW MEMBERS</span><h1>크루원</h1><p className="muted">크루원 프로필과 활동, PB 달성 현황을 확인합니다.</p></section><div className="mobileCardList crewMemberList">{(members||[]).map((m:any)=>{const s=stats.get(m.user_id)||{count:0,km:0,last:null};const profile:any=profileMap.get(m.user_id);const avatar=avatarMap.get(m.user_id);const pbs=(pbMap.get(m.user_id)||[]) as string[];return <article className="card mobileListCard crewMemberCard" key={m.user_id}><div className="crewMemberAvatarWrap"><img className="crewMemberAvatar" src={avatar||"/home-assets/quick-crew.png"} alt={`${profile?.display_name||"러너"} 프로필 사진`} loading="eager" decoding="async" referrerPolicy="no-referrer"/></div><div className="crewMemberInfo"><small>{roleName(m.role)}</small><div className="crewMemberNameRow"><h3>{profile?.display_name||"러너"}</h3>{pbs.length>0&&<span className="crewMemberPbIcon" title={`PB 달성 · ${pbs.map(pbName).join(" · ")}`} aria-label={`PB 달성 · ${pbs.map(pbName).join(" · ")}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z"/><path d="M6 5H4v1.5A3.5 3.5 0 0 0 7.5 10M18 5h2v1.5A3.5 3.5 0 0 1 16.5 10M12 12v4M8.5 20h7M10 16h4v4h-4z"/></svg></span>}</div><p>{s.count}회 · {s.km.toFixed(1)}km · 최근 {s.last||"없음"}</p>{pbs.length>0&&<div className="crewMemberPbList"><span>PB</span>{pbs.map(flag=><b key={flag}>{pbName(flag)}</b>)}</div>}</div></article>})}</div></main>;
}
