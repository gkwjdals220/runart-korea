import Link from "next/link";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function MyPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user){
  return <main className="wrap"><header className="top"><Brand/></header><section className="hero compact"><div><span className="eyebrow">MY RUNART</span><h1>MY</h1><p className="muted">로그인하면 찜한 코스, RUN + EAT 일정, 크루 기록을 한 곳에서 관리할 수 있습니다.</p><div className="actions" style={{marginTop:18}}><Link className="btn" href="/login">로그인</Link><Link className="btn ghost" href="/join">회원가입</Link></div></div></section></main>;
 }
 const {data:profile}=await sb.from("runart_profiles").select("display_name").eq("user_id",user.id).maybeSingle();
 const {count:favCount}=await sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id);
 const {count:planCount}=await sb.from("runart_run_eat_plans").select("id",{count:"exact",head:true}).eq("user_id",user.id);
 return <main className="wrap">
  <header className="top"><Brand/><div className="nav"><Link className="btn ghost" href="/">홈</Link><Link className="btn ghost" href="/favorites">찜</Link></div></header>
  <section className="hero compact"><div><span className="eyebrow">MY RUNART</span><h1>{profile?.display_name||"러너"}님</h1><p className="muted">러닝 코스, 먹방 일정, 크루 활동을 한 번에 관리하세요.</p></div><div className="heroStats"><b>{favCount||0}</b><span>찜한 코스</span><b>{planCount||0}</b><span>RUN + EAT</span></div></section>
  <section className="myQuickGrid">
   <Link className="card myQuickCard" href="/favorites"><span>♡</span><div><b>내 찜</b><small>코스·맛집·RUN + EAT</small></div><em>→</em></Link>
   <Link className="card myQuickCard" href="/dashboard"><span>◉</span><div><b>크루 기록</b><small>출석·활동·러닝 로그</small></div><em>→</em></Link>
   <Link className="card myQuickCard" href="/races"><span>🏁</span><div><b>대회 일정</b><small>참가 현황과 신청 관리</small></div><em>→</em></Link>
   <Link className="card myQuickCard" href="/manage"><span>⚙</span><div><b>크루 관리</b><small>멤버와 운영 설정</small></div><em>→</em></Link>
  </section>
 </main>;
}
