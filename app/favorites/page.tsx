import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

export default async function Favorites(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const [{count:courseCount},{count:placeCount},{count:planCount}]=await Promise.all([
  sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id),
  sb.from("runart_place_favorites").select("place_id",{count:"exact",head:true}).eq("user_id",user.id),
  sb.from("runart_run_eat_plans").select("id",{count:"exact",head:true}).eq("user_id",user.id)
 ]);
 return <main className="wrap hubPage"><header className="top compactPageTop"><Brand/><Link className="btn ghost" href="/my">MY</Link></header><section className="compactPageHero"><span className="eyebrow">MY TTWITTUN</span><h1>저장함</h1><p className="muted">길게 스크롤하지 않고 필요한 목록으로 바로 이동하세요.</p></section><section className="pageHubGrid"><Link href="/favorites/courses" className="hubTile"><span>♡</span><div><small>COURSES</small><h2>찜한 코스</h2><p>다음 러닝 후보</p></div><b>{courseCount||0} ›</b></Link><Link href="/favorites/places" className="hubTile"><span>☕</span><div><small>PLACES</small><h2>맛집·카페</h2><p>러닝 후 갈 곳</p></div><b>{placeCount||0} ›</b></Link><Link href="/favorites/plans" className="hubTile"><span>🍴</span><div><small>RUN + EAT</small><h2>저장한 일정</h2><p>러닝 + 식사 플랜</p></div><b>{planCount||0} ›</b></Link><Link href="/explore" className="hubTile"><span>⌕</span><div><small>DISCOVER</small><h2>새 코스 찾기</h2><p>지도·검색·필터</p></div><b>›</b></Link></section></main>;
}
