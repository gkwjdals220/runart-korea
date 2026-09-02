import "./globals.css";
import "./discovery.css";
import "./ux-refresh.css";
import "./flow-polish.css";
import "./explorer-polish.css";
import "./journey-flow.css";
import "./places-polish.css";
import "./toilets.css";
import "./ui-fixes.css";
import "./board-home.css";
import "./mobile-pages.css";
import "./mobile-overlap-fixes.css";
import "leaflet/dist/leaflet.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import UrgentFacilityNav from "@/components/UrgentFacilityNav";

export const metadata={
  title:"TTWITTUN · 러닝 코스 & 개인 기록",
  description:"대한민국 러닝 코스 탐색 · GPS 러닝 · 개인 기록 · 크루 러닝 플랫폼"
};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="ko"><body><div id="top"/>{children}<UrgentFacilityNav/><MobileBottomNav/></body></html>;
}
