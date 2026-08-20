"use client";

import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export default function LogoutButton(){
  const router=useRouter();
  async function logout(){
    const sb=createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return <button className="btn ghost" onClick={logout}>로그아웃</button>;
}
