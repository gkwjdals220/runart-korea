"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

const sample=`[
  {
    "name":"샘플 코스",
    "region":"경기",
    "city":"안양",
    "course_type":"normal",
    "distance_km":8.15,
    "difficulty":2,
    "tags":["하천","야간","초보"],
    "surface":"아스팔트",
    "loop_type":"out_back",
    "verified":false,
    "start_name":"학운공원",
    "elevation_gain_m":35,
    "data_quality":"community",
    "route_geojson":{"type":"LineString","coordinates":[[126.9561,37.3938],[126.9619,37.3988]]}
  }
]`;

export default function BulkCourseImport(){
 const [text,setText]=useState(sample);const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 async function run(){let data:any;try{data=JSON.parse(text);if(!Array.isArray(data))throw new Error()}catch{return setMsg("JSON 배열 형식을 확인해주세요.")}
 setBusy(true);const sb=createClient();const {data:count,error}=await sb.rpc("runart_admin_bulk_import_courses",{p_courses:data});setBusy(false);setMsg(error?error.message:`${count}개 코스를 등록했습니다.`);if(!error)setTimeout(()=>location.reload(),700)}
 return <div className="card"><h3>전국 코스 일괄 등록</h3><p className="muted">관리자용 JSON Import입니다. GPX/공공데이터를 변환한 코스를 여러 개 한 번에 넣을 수 있습니다.</p><textarea value={text} onChange={e=>setText(e.target.value)} style={{minHeight:300,fontFamily:"monospace",fontSize:11}}/><div className="actions"><button className="btn" disabled={busy} onClick={run}>{busy?"등록 중...":"JSON 일괄 등록"}</button></div>{msg&&<p className="muted">{msg}</p>}</div>
}
