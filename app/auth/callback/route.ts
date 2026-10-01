import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

function safeNext(value:string|null){
  if(!value||!value.startsWith("/")||value.startsWith("//"))return "/login?confirmed=1";
  return value;
}

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const next=safeNext(url.searchParams.get("next"));
  if(code){
    const sb=await createClient();
    const {error}=await sb.auth.exchangeCodeForSession(code);
    if(!error)return NextResponse.redirect(new URL(next,url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirmation_failed",url.origin));
}
