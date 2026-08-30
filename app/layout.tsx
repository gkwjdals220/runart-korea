import "./globals.css";
import "./discovery.css";
import "./ux-refresh.css";
import "./toilets.css";
import "leaflet/dist/leaflet.css";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata={
  title:"RUNART KOREA · 뛰뚠뛰뚠",
  description:"대한민국 러닝 코스 · GPS 아트 · 크루 러닝 기록 플랫폼"
};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="ko"><body><div id="top"/>{children}<MobileBottomNav/></body></html>;
}
