import {notFound} from "next/navigation";
import RunModeV2 from "@/components/RunModeV2";
import {createClient} from "@/lib/supabase/server";

export default async function RunModePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 const {data:course}=await sb.from("runart_courses").select("id,name,distance_km,route_geojson,start_name,status").eq("id",id).eq("status","approved").maybeSingle();
 if(!course)notFound();
 let crewId:string|null=null;
 if(user){const {data:membership}=await sb.from("runart_crew_members").select("crew_id").eq("user_id",user.id).limit(1).maybeSingle();crewId=membership?.crew_id||null;}
 return <RunModeV2 courseId={course.id} courseName={course.name} targetKm={Number(course.distance_km||0)} routeGeojson={course.route_geojson} startName={course.start_name} userId={user?.id||null} crewId={crewId}/>;
}
