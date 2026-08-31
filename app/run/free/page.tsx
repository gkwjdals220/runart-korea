import RunModeV2 from "@/components/RunModeV2";
import {createClient} from "@/lib/supabase/server";

export default async function FreeRunPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 return <RunModeV2 freeRun courseName="자유 러닝" userId={user?.id||null}/>;
}
