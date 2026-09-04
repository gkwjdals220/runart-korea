import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type NativeRunPoint = { lat: number; lng: number; ts: number; accuracy?: number };
export type NativeRunSnapshot = { available: boolean; nativePlugin?: boolean; running: boolean; paused: boolean; distanceM: number; elapsed: number; paceSecPerKm?: number; accuracy?: number; point?: NativeRunPoint; track?: NativeRunPoint[]; liveActivitySupported?: boolean; liveActivityEnabled?: boolean; liveActivityActive?: boolean; liveActivityError?: string };
type NativeRunPlugin = {
  start(options: { name: string }): Promise<NativeRunSnapshot>;
  pause(): Promise<NativeRunSnapshot>;
  resume(): Promise<NativeRunSnapshot>;
  stop(): Promise<NativeRunSnapshot>;
  status(): Promise<NativeRunSnapshot>;
  addListener(eventName: "runUpdate", listener: (value: NativeRunSnapshot) => void): Promise<PluginListenerHandle>;
  addListener(eventName: "runError", listener: (value: { message: string }) => void): Promise<PluginListenerHandle>;
};
export const TTWITTUNRun = registerPlugin<NativeRunPlugin>("TTWITTUNRun");
export const canUseNativeRun = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
