import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const allowedTypes=new Set(["signup","invite","magiclink","recovery","email_change","email"]);

export async function GET(request:Request){
  const url=new URL(request.url);
  const token_hash=url.searchParams.get("token_hash");
  const type=url.searchParams.get("type")||"recovery";
  const next=url.searchParams.get("next")||"/reset-password";
  const safeNext=next.startsWith("/")&&!next.startsWith("//")?next:"/reset-password";

  if(!token_hash||!allowedTypes.has(type)){
    return NextResponse.redirect(new URL("/login?error=recovery_link_invalid",url.origin));
  }

  const sb=await createClient();
  const {error}=await sb.auth.verifyOtp({token_hash,type:type as any});
  if(error){
    console.error("auth confirm failed",{type,code:(error as any)?.code,message:error.message});
    return NextResponse.redirect(new URL(`/login?error=recovery_link_invalid`,url.origin));
  }

  return NextResponse.redirect(new URL(safeNext,url.origin));
}
