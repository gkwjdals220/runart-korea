import Link from "next/link";
import {redirect} from "next/navigation";
import HubIcon from "@/components/HubIcon";
import {createClient} from "@/lib/supabase/server";

type SavedIcon="course"|"place"|"plan"|"discover";
function SavedCard({href,icon,label,title,description,count}:{href:string;icon:SavedIcon;label:string;title:string;description:string;count?:number}){
 return <Link href={href} className="hubTile savedHubTile">
  <HubIcon name={icon}/>
  <div className="hubTileCopy"><small>{label}</small><h2>{title}</h2><p>{description}</p></div>
  <b className="hubTileChevron">{count!=null?`${count} `:""}›</b>
 </Link>;
}

export default async function Favorites(){
 const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)redirect("/login");
 const [{count:courseCount},{count:placeCount},{count:planCount}]=await Promise.all([
  sb.from("runart_favorites").select("course_id",{count:"exact",head:true}).eq("user_id",user.id),
  sb.from("runart_place_favorites").select("place_id",{count:"exact",head:true}).eq("user_id",user.id),
  sb.from("runart_run_eat_plans").select("id",{count:"exact",head:true}).eq("user_id",user.id)
 ]);
 return <main className="wrap hubPage savedHubPage">
  <section className="compactPageHero"><span className="eyebrow">MY TTWITTUN</span><h1>저장함</h1><p className="muted">저장한 코스와 장소, 러닝 일정을 한곳에서 확인하세요.</p></section>
  <section className="pageHubGrid savedHubGrid">
   <SavedCard href="/favorites/courses" icon="course" label="COURSES" title="찜한 코스" description="다음에 달릴 러닝 코스" count={courseCount||0}/>
   <SavedCard href="/favorites/places" icon="place" label="PLACES" title="맛집·카페" description="러닝 후 저장한 장소" count={placeCount||0}/>
   <SavedCard href="/favorites/plans" icon="plan" label="RUN + EAT" title="저장한 일정" description="러닝과 식사 플랜" count={planCount||0}/>
   <SavedCard href="/explore" icon="discover" label="DISCOVER" title="새 코스 찾기" description="새로운 러닝 코스를 찾아보세요"/>
  </section>
 </main>;
}
