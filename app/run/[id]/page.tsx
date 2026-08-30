import {notFound} from "next/navigation";
import RunMode from "@/components/RunMode";
import {createClient} from "@/lib/supabase/server";

export default async function RunModePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:course}=await sb.from("runart_courses").select("id,name,distance_km,route_geojson,start_name,status").eq("id",id).eq("status","approved").maybeSingle();
 if(!course)notFound();
 return <RunMode courseId={course.id} courseName={course.name} targetKm={Number(course.distance_km||0)} routeGeojson={course.route_geojson} startName={course.start_name}/>;
}
