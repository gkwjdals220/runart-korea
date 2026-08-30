"use client";
import Link from "next/link";
import {useMemo,useState} from "react";

type Tile={label:string;icon:string;href:string;hint:string;tone:string};
const tiles:Tile[]=[
 {label:"START",icon:"🏁",href:"#explore",hint:"오늘의 러닝 코스를 골라보세요.",tone:"start"},
 {label:"한강공원",icon:"🌳",href:"#waterfront",hint:"한강과 수변 코스를 추천해요.",tone:"green"},
 {label:"수변 러닝",icon:"🌊",href:"#waterfront",hint:"호수·하천을 따라 달려보세요.",tone:"blue"},
 {label:"카페",icon:"☕",href:"#run-eat",hint:"러닝 후 카페까지 이어보세요.",tone:"yellow"},
 {label:"GPS 아트",icon:"🎨",href:"#art-runs",hint:"달리며 그림을 완성하는 코스예요.",tone:"orange"},
 {label:"CHANCE",icon:"🎲",href:"#recommend",hint:"주사위를 굴려 랜덤 코스를 만나보세요.",tone:"pink"},
 {label:"맛집",icon:"🍴",href:"#run-eat",hint:"RUN + EAT 코스를 확인해요.",tone:"red"},
 {label:"숲길",icon:"🌲",href:"#easy-runs",hint:"편안한 공원·숲길 코스를 골라요.",tone:"green"},
 {label:"야간",icon:"🌙",href:"#night-runs",hint:"야간 러닝 추천 코스를 확인해요.",tone:"purple"},
 {label:"역세권",icon:"🚉",href:"#explore",hint:"지역과 출발지로 코스를 찾아보세요.",tone:"blue"},
 {label:"GOAL",icon:"🏆",href:"#explore",hint:"마음에 드는 코스를 저장하고 출발해요.",tone:"goal"},
 {label:"공원",icon:"🌿",href:"#easy-runs",hint:"가볍게 시작하기 좋은 코스예요.",tone:"green"},
 {label:"카페",icon:"🥤",href:"#run-eat",hint:"러닝 후 쉬어갈 장소를 찾아보세요.",tone:"yellow"},
 {label:"둘레길",icon:"⛰️",href:"#challenge-runs",hint:"조금 더 긴 도전 코스를 추천해요.",tone:"earth"},
 {label:"랜드마크",icon:"🗼",href:"#recommend",hint:"도시를 여행하듯 달리는 코스예요.",tone:"purple"},
 {label:"CHANCE",icon:"❓",href:"#recommend",hint:"한 번 더 굴려 새로운 코스를 만나보세요.",tone:"pink"},
 {label:"산책길",icon:"🚶",href:"#easy-runs",hint:"부담 없는 짧은 코스를 추천해요.",tone:"green"},
 {label:"한옥·도심",icon:"🏯",href:"#recommend",hint:"도심 테마 코스를 발견해보세요.",tone:"earth"},
 {label:"아트 포인트",icon:"📍",href:"#art-runs",hint:"GPS 아트와 테마런으로 이동해요.",tone:"orange"}
];

export default function InteractiveRunBoard(){
 const [pos,setPos]=useState(0);const [rolling,setRolling]=useState(false);const [dice,setDice]=useState<number|null>(null);
 const tile=tiles[pos];
 const ordered=useMemo(()=>tiles,[]);
 function roll(){if(rolling)return;setRolling(true);const value=1+Math.floor(Math.random()*6);setDice(value);setTimeout(()=>{setPos(p=>(p+value)%tiles.length);setRolling(false)},420)}
 return <section className="interactiveBoardWrap" aria-label="RUNART 인터랙티브 러닝 보드">
  <div className="boardToolbar"><div><span className="eyebrow">RUNART BOARD</span><h2>주사위를 굴려 오늘의 러닝을 골라보세요</h2></div><div className="boardToolbarActions"><button className="boardDiceButton" type="button" onClick={roll} disabled={rolling}>{rolling?"굴리는 중…":dice?`🎲 ${dice} · 다시 굴리기`:"🎲 주사위 굴리기"}</button><a className="boardExploreLink" href="#explore">직접 찾기 →</a></div></div>
  <div className="interactiveBoard">
   <div className="boardTrack">{ordered.map((t,i)=><Link href={t.href} key={`${t.label}-${i}`} className={`interactiveTile ${t.tone} ${i===pos?"active":""}`} onClick={()=>setPos(i)}><span className="tileIcon">{t.icon}</span><b>{t.label}</b>{i===pos&&<span className="runnerToken" aria-label="현재 위치">🏃</span>}</Link>)}</div>
   <div className="interactiveBoardCenter"><div className="boardLogo">RUNART <span>KOREA</span></div><p>{rolling?"주사위가 굴러가는 중이에요…":tile.hint}</p><div className="boardCurrent"><span>{tile.icon}</span><div><small>현재 칸</small><b>{tile.label}</b></div></div><Link href={tile.href} className="boardPrimaryAction">{tile.label} 보러가기 →</Link><small className="boardHelp">보드의 각 칸을 직접 눌러도 이동할 수 있어요.</small></div>
  </div>
 </section>
}
