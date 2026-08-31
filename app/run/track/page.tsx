import TrackRunStudio from "@/components/TrackRunStudio";
import {createClient} from "@/lib/supabase/server";

export default async function TrackRunPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 return <TrackRunStudio userId={user?.id||null}/>;
}
