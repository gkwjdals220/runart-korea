import RunModeV2 from "@/components/RunModeV2";
import {createClient} from "@/lib/supabase/server";

export default async function TrackRunPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 return <RunModeV2 trackRun courseName="트랙런" userId={user?.id||null}/>;
}
