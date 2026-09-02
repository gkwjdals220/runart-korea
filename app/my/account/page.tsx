import Link from "next/link";
import {redirect} from "next/navigation";
import Brand from "@/components/Brand";
import {createClient} from "@/lib/supabase/server";

async function requestDeletion(formData:FormData){
 "use server";
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const reason=String(formData.get("reason")||"").trim().slice(0,500);
 const {data:existing}=await sb.from("runart_account_deletion_requests").select("id,status").eq("user_id",user.id).in("status",["requested","processing"]).order("requested_at",{ascending:false}).limit(1).maybeSingle();
 if(!existing)await sb.from("runart_account_deletion_requests").insert({user_id:user.id,reason:reason||null,status:"requested"});
 redirect("/my/account?requested=1");
}

async function cancelDeletion(){
 "use server";
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:existing}=await sb.from("runart_account_deletion_requests").select("id").eq("user_id",user.id).eq("status","requested").order("requested_at",{ascending:false}).limit(1).maybeSingle();
 if(existing)await sb.from("runart_account_deletion_requests").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",existing.id).eq("user_id",user.id);
 redirect("/my/account");
}

export default async function AccountPage(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/login");
 const {data:req}=await sb.from("runart_account_deletion_requests").select("id,status,requested_at").eq("user_id",user.id).order("requested_at",{ascending:false}).limit(1).maybeSingle();
 const active=req&&["requested","processing"].includes(req.status);
 return <main className="wrap hubPage legalPage">
  <header className="top compactPageTop"><Brand/><div className="nav"><Link className="btn ghost" href="/my">← MY</Link></div></header>
  <section className="compactPageHero"><span className="eyebrow">ACCOUNT</span><h1>계정 관리</h1><p className="muted">계정 및 저장 데이터 삭제 요청</p></section>
  <section className="legalCard">
   <h2>계정 삭제</h2>
   <p>삭제 요청이 처리되면 로그인 계정과 TTWITTUN에 저장된 개인 프로필, 개인 러닝 기록, 즐겨찾기, 개인 대회 참가 정보 등 계정에 연결된 데이터를 삭제하는 절차가 진행됩니다. 법령상 보관이 필요한 정보가 있는 경우 해당 기간 동안 별도로 보관될 수 있습니다.</p>
   {active?<>
    <div className="accountDeleteStatus"><b>{req.status==="processing"?"삭제 처리 중":"삭제 요청 접수됨"}</b><small>{new Date(req.requested_at).toLocaleString("ko-KR")}</small></div>
    {req.status==="requested"&&<form action={cancelDeletion}><button className="btn ghost" type="submit">삭제 요청 취소</button></form>}
   </>:<form className="accountDeleteForm" action={requestDeletion}>
    <label>삭제 사유 <small>(선택)</small><textarea name="reason" maxLength={500} placeholder="서비스 개선을 위해 남겨주셔도 됩니다."/></label>
    <button className="btn danger" type="submit">계정 삭제 요청</button>
   </form>}
   <p className="accountDeleteNote">삭제 요청 전 필요한 러닝 기록이나 대회 메모가 있다면 먼저 확인해주세요.</p>
  </section>
 </main>
}
