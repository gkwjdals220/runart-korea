"use client";

import {useState} from "react";

function setExplorerSearch(value:string){
 const input=document.querySelector<HTMLInputElement>(".explorerSearchRow input");
 if(!input)return false;
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
 setter?.call(input,value);
 input.dispatchEvent(new Event("input",{bubbles:true}));
 input.dispatchEvent(new Event("change",{bubbles:true}));
 input.focus();
 return true;
}

export default function ExplorerPresetButtons(){
 const [river,setRiver]=useState(false);
 function toggleRiver(){const next=!river;if(setExplorerSearch(next?"하천":"")){setRiver(next);setTimeout(()=>document.querySelector(".explorer")?.scrollIntoView({behavior:"smooth",block:"start"}),40)}}
 return <div className="explorerQuickChips" style={{margin:"10px 0 12px"}}><button type="button" className={`chip ${river?"on":""}`} onClick={toggleRiver}>{river?"🌊 하천만 보기 ON":"🌊 하천만 보기"}</button></div>;
}
