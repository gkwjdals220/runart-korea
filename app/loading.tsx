export default function Loading(){
 return <main className="wrap" aria-live="polite" aria-busy="true">
  <div style={{minHeight:"58vh",display:"grid",placeItems:"center",padding:"40px 20px"}}>
   <div style={{display:"grid",gap:12,justifyItems:"center",textAlign:"center"}}>
    <div className="routeLoadingSpinner" aria-hidden="true"/>
    <b>페이지를 준비하고 있어요</b>
    <small className="muted">잠시만 기다려 주세요.</small>
   </div>
  </div>
 </main>;
}
