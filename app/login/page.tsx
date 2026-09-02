import {Suspense} from "react";
import Image from "next/image";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function Login(){
  return <main className="wrap authLoginPage">
    <div className="card authLoginCard" style={{maxWidth:450,margin:"50px auto"}}>
      <Image className="loginLogo" src="/ttunttun-logo.jpeg" width={220} height={220} alt="뛰뚠뛰뚠 로고"/>
      <span className="eyebrow" style={{display:"block",textAlign:"center"}}>TTWITTUN</span>
      <h1 style={{textAlign:"center"}}>로그인</h1>
      <p className="muted" style={{textAlign:"center"}}>러닝 기록과 크루 기능을 이어서 사용하세요.</p>
      <Suspense fallback={<p className="muted" style={{textAlign:"center"}}>로그인 화면 불러오는 중...</p>}><AuthForm/></Suspense>
      <p style={{textAlign:"center",marginTop:20}}><Link className="muted" href="/">← 홈으로</Link></p>
    </div>
  </main>;
}
