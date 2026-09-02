"use client";
import {useMemo,useState} from "react";
type T="daily"|"recovery"|"tempo"|"race"|"long";type F="neutral"|"wide"|"flat"|"high";
type S={brand:string;name:string;t:T[];f:F[];drop:string;feel:string;why:string;url:string};
const types:{id:T;label:string;help:string}[]=[["daily","데일리","조깅·기초 훈련"],["recovery","회복·쿠션","편안한 이지런"],["tempo","템포","스피드 훈련"],["race","레이스","기록 도전"],["long","장거리","롱런·마라톤"]].map(x=>({id:x[0] as T,label:x[1],help:x[2]}));
const feet:{id:F;label:string;help:string}[]=[["neutral","중립·보통","마모가 비교적 고름"],["wide","발볼 넓음","앞볼 압박·쓸림"],["flat","평발·과내전","안쪽으로 많이 무너짐"],["high","높은 아치·외전","바깥 마모·충격 큼"]].map(x=>({id:x[0] as F,label:x[1],help:x[2]}));
const shoes:S[]=[
 {brand:"Nike",name:"Pegasus 42",t:["daily","long"],f:["neutral","wide"],drop:"10mm",feel:"균형 쿠션",why:"조깅부터 롱런까지 쓰기 쉬운 올라운더. 공식 와이드 옵션도 확인할 수 있어요.",url:"https://www.nike.com/kr/w/running-shoes-37v7jzy7ok"},
 {brand:"Nike",name:"Vomero Plus",t:["recovery","long"],f:["neutral","high"],drop:"10mm",feel:"맥스 쿠션",why:"회복주와 오래 달리는 날 편안함을 우선할 때 적합해요.",url:"https://www.nike.com/kr/w/running-shoes-37v7jzy7ok"},
 {brand:"ASICS",name:"GEL-NIMBUS 27",t:["recovery","long"],f:["neutral","high","wide"],drop:"8mm",feel:"부드러운 쿠션",why:"착지 충격 완화와 장거리 편안함을 중시할 때 좋은 후보예요.",url:"https://www.asics.com/kr/ko-kr/mk/training"},
 {brand:"ASICS",name:"GEL-KAYANO",t:["daily","long"],f:["flat","wide"],drop:"안정화",feel:"구조적 지지",why:"평발·과내전 경향으로 안쪽 지지가 필요한 러너를 위한 안정화 계열이에요.",url:"https://www.asics.com/kr/ko-kr/mk/training"},
 {brand:"adidas",name:"Adizero Boston 13",t:["tempo","long"],f:["neutral"],drop:"6mm",feel:"탄성·스피드",why:"템포런과 마라톤 페이스 훈련을 연결하기 좋은 훈련화예요.",url:"https://www.adidas.co.kr/adizero_boston"},
 {brand:"adidas",name:"Adizero Adios Pro",t:["race"],f:["neutral"],drop:"레이스형",feel:"카본·고반발",why:"충분히 적응한 러너의 기록 도전용이며 첫 러닝화로는 권하지 않아요.",url:"https://www.adidas.co.kr/running-shoes"}];
export default function ShoeGuideFinder(){
 const[t,setT]=useState<T>("daily"),[f,setF]=useState<F>("neutral");
 const exact=useMemo(()=>shoes.filter(s=>s.t.includes(t)&&s.f.includes(f)),[t,f]);
 const rows=exact.length?exact:shoes.filter(s=>s.t.includes(t)).slice(0,3);
 return <section className="shoeFinder">
  <div className="shoeFinderHead"><span className="eyebrow">PERSONAL SHOE MATCH</span><h2>내 러닝에 맞는 신발 찾기</h2><p>러닝 목적과 족형을 차례로 선택하세요.</p></div>
  <div className="shoeQuestion"><b><i>1</i> 주로 어떤 러닝을 하나요?</b><div className="shoeChoices">{types.map(x=><button className={t===x.id?"on":""} onClick={()=>setT(x.id)} key={x.id}><strong>{x.label}</strong><span>{x.help}</span></button>)}</div></div>
  <div className="shoeQuestion"><b><i>2</i> 발 모양과 착화감은 어떤가요?</b><div className="shoeChoices foot">{feet.map(x=><button className={f===x.id?"on":""} onClick={()=>setF(x.id)} key={x.id}><strong>{x.label}</strong><span>{x.help}</span></button>)}</div></div>
  <div className="shoeResults"><div className="shoeResultTitle"><span>추천 결과</span><b>{rows.length}개 모델</b></div>{!exact.length&&<p className="shoeFallback">정확히 일치하는 후보가 적어 러닝 유형 우선 모델을 표시합니다. 구매 전 착화를 권장해요.</p>}<div className="shoeResultGrid">{rows.map((s,i)=><article className="shoeMatchCard" key={s.name}><div><span>0{i+1}</span><em>{s.brand}</em></div><h3>{s.name}</h3><p>{s.why}</p><dl><div><dt>드롭</dt><dd>{s.drop}</dd></div><div><dt>성향</dt><dd>{s.feel}</dd></div></dl><div className="shoeCardActions"><a className="shoeBuyLink" href={s.url} target="_blank" rel="noreferrer">공식몰 구매·재고 확인 ↗</a><a className="shoeAddLink" href={`/my/shoes?brand=${encodeURIComponent(s.brand)}&model=${encodeURIComponent(s.name)}&target=500`}>＋ 내 러닝화에 등록</a></div></article>)}</div></div>
  <aside className="footTypeGuide"><h3>족형 빠른 확인</h3><div><b>중립</b><span>밑창 마모가 비교적 고르고 한쪽으로 심하게 기울지 않음</span></div><div><b>평발·과내전</b><span>착지 후 발목이 안쪽으로 많이 무너짐 → 안정화 우선</span></div><div><b>높은 아치·외전</b><span>바깥쪽 마모가 크고 충격이 크게 느껴짐 → 쿠션형 우선</span></div><div><b>발볼 넓음</b><span>길이만 늘리지 말고 Wide·2E 옵션을 먼저 확인</span></div><p>자가 확인은 참고용입니다. 통증이나 부상 이력이 있으면 전문 매장 보행 분석 또는 의료진 상담을 우선하세요.</p></aside>
 </section>;
}