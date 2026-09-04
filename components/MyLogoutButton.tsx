"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export default function MyLogoutButton(){
  const router=useRouter();
  const [loading,setLoading]=useState(false);

  const logout=async()=>{
    if(loading) return;
    setLoading(true);
    try{
      const sb=createClient();
      await sb.auth.signOut();
      router.replace("/");
      router.refresh();
    }finally{
      setLoading(false);
    }
  };

  return <button type="button" className="btn ghost myLogoutButton" onClick={logout} disabled={loading}>
    {loading?"로그아웃 중…":"로그아웃"}
  </button>;
}
