import {Capacitor, registerPlugin, type PluginListenerHandle} from "@capacitor/core";

export type WatchRunPoint={lat:number;lng:number;ts:number;accuracy?:number};
export type WatchRunPayload={
 id:string;
 source:"apple_watch"|string;
 startedAt:number;
 finishedAt:number;
 elapsedSeconds:number;
 distanceMeters:number;
 avgPaceSecPerKm?:number;
 activeCalories?:number;
 averageHeartRate?:number;
 workoutUUID?:string;
 route?:WatchRunPoint[];
};
export type WatchStatus={supported:boolean;paired:boolean;watchAppInstalled:boolean;reachable:boolean;activationState?:number};

type WatchPlugin={
 status():Promise<WatchStatus>;
 pendingRuns():Promise<{runs:WatchRunPayload[]}>;
 acknowledge(options:{id:string}):Promise<void>;
 requestFlush():Promise<WatchStatus>;
 addListener(eventName:"watchRunReceived",listener:(value:WatchRunPayload)=>void):Promise<PluginListenerHandle>;
};

export const TTWITTUNWatch=registerPlugin<WatchPlugin>("TTWITTUNWatch");
export const canUseWatchBridge=()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="ios";
