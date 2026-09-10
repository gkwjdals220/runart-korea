import {Suspense} from "react";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage(){
  return <main className="wrap authLoginPage">
    <div className="card authLoginCard" style={{maxWidth:450,margin:"50px auto"}}>
      <span className="eyebrow" style={{display:"block",textAlign:"center"}}>TTWITTUN</span>
      <h1 style={{textAlign:"center"}}>새 비밀번호 설정</h1>
      <p className="muted" style={{textAlign:"center"}}>새로 사용할 비밀번호를 입력해주세요.</p>
      <Suspense fallback={<p className="muted" style={{textAlign:"center"}}>화면 불러오는 중...</p>}><ResetPasswordForm/></Suspense>
      <p style={{textAlign:"center",marginTop:20}}><Link className="muted" href="/login">로그인으로 돌아가기</Link></p>
    </div>
  </main>;
}
