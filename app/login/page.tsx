import {Suspense} from "react";
import Image from "next/image";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function Login(){
  return <main className="wrap">
    <div className="card" style={{maxWidth:450,margin:"50px auto"}}>
      <Image className="loginLogo" src="/ttunttun-logo.jpeg" width={260} height={260} alt="뛰뚠뛰뚠 로고"/>
      <h1 style={{textAlign:"center"}}>뛰뚠뛰뚠 로그인</h1>
      <p className="muted" style={{textAlign:"center"}}>RUNART KOREA 크루 공용 기록</p>
      <Suspense fallback={<p className="muted" style={{textAlign:"center"}}>로그인 화면 불러오는 중...</p>}>
        <AuthForm/>
      </Suspense>
      <p style={{textAlign:"center",marginTop:20}}><Link className="muted" href="/">← 코스 화면</Link></p>
    </div>
  </main>;
}
