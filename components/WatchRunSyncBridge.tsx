"use client";

import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client";
import {canUseWatchBridge,TTWITTUNWatch,type WatchRunPayload} from "@/lib/native-watch";

function routeGeo(run:WatchRunPayload){
 const route=(run.route||[]).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
 return route.length>=2?{
  type:"LineString",
  coordinates:route.map(p=>[p.lng,p.lat]),
  properties:{
   source:"apple_watch",
   watch_run_id:run.id,
   workout_uuid:run.workoutUUID||null,
   active_calories:Number(run.activeCalories||0),
   average_heart_rate:Number(run.averageHeartRate||0),
   points:route.map(p=>({ts:p.ts,accuracy:p.accuracy}))
  }
 }: {type:"LineString",coordinates:[],properties:{source:"apple_watch",watch_run_id:run.id,workout_uuid:run.workoutUUID||null,active_calories:Number(run.activeCalories||0),average_heart_rate:Number(run.averageHeartRate||0)}};
}

export default function WatchRunSyncBridge(){
 useEffect(()=>{
  if(!canUseWatchBridge())return;
  let active=true;
  const sb=createClient();

  async function syncRun(run:WatchRunPayload){
   if(!active||!run?.id)return;
   const {data:{user}}=await sb.auth.getUser();
   if(!user)return;
   const startedAt=new Date(Number(run.startedAt||Date.now())).toISOString();
   const finishedAt=new Date(Number(run.finishedAt||Date.now())).toISOString();
   const km=Math.max(0,Number(run.distanceMeters||0)/1000);
   const elapsed=Math.max(0,Math.round(Number(run.elapsedSeconds||0)));
   const avg=Number(run.avgPaceSecPerKm||0)>0?Math.round(Number(run.avgPaceSecPerKm)):km>=0.05?Math.round(elapsed/km):null;

   const {data:existing}=await sb.from("runart_live_runs")
    .select("id")
    .eq("user_id",user.id)
    .eq("run_mode","watch")
    .eq("started_at",startedAt)
    .limit(1)
    .maybeSingle();
   if(!existing){
    const {error}=await sb.from("runart_live_runs").insert({
     user_id:user.id,
     course_id:null,
     crew_id:null,
     shoe_id:null,
     run_mode:"watch",
     started_at:startedAt,
     finished_at:finishedAt,
     elapsed_seconds:elapsed,
     distance_km:Number(km.toFixed(3)),
     avg_pace_sec_per_km:avg,
     best_pace_sec_per_km:null,
     pb_1k_sec:null,
     pb_3k_sec:null,
     pb_5k_sec:null,
     pb_10k_sec:null,
     pb_flags:[],
     splits:[],
     track_geojson:routeGeo(run)
    });
    if(error)throw error;
   }
   await TTWITTUNWatch.acknowledge({id:run.id});
   window.dispatchEvent(new CustomEvent("ttwittun:watch-run-synced",{detail:{id:run.id}}));
  }

  async function flush(){
   try{
    await TTWITTUNWatch.requestFlush();
    const {runs}=await TTWITTUNWatch.pendingRuns();
    for(const run of runs||[]){
     try{await syncRun(run)}catch(error){console.warn("TTWITTUN watch sync failed",error)}
    }
   }catch(error){console.warn("TTWITTUN watch bridge unavailable",error)}
  }

  const listener=TTWITTUNWatch.addListener("watchRunReceived",run=>{void syncRun(run).catch(error=>console.warn("TTWITTUN watch run import failed",error))});
  const onState=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.isActive)void flush()};
  window.addEventListener("ttwittun:app-state",onState);
  void flush();
  return()=>{active=false;window.removeEventListener("ttwittun:app-state",onState);void listener.then(h=>h.remove())};
 },[]);
 return null;
}
