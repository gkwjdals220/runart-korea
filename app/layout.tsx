import "./globals.css";
import "./discovery.css";
import "./ux-refresh.css";
import "./flow-polish.css";
import "./explorer-polish.css";
import "./explorer-dialog-fixes.css";
import "./journey-flow.css";
import "./places-polish.css";
import "./toilets.css";
import "./ui-fixes.css";
import "./board-home.css";
import "./mobile-pages.css";
import "./mobile-overlap-fixes.css";
import "./mobile-explorer-nav.css";
import "./mobile-explorer-refine.css";
import "./race-live.css";
import "./race-calendar.css";
import "./mobile-input-fixes.css";
import "./run-tools.css";
import "./run-shoe-picker.css";
import "./shoe-guide.css";
import "./run-club-refresh.css";
import "./mobile-ux-stability.css";
import "./detail-theme.css";
import "./app-theme.css";
import "./performance-ux.css";
import "./explorer-search-flow.css";
import "./ios-mobile-fixes.css";
import "./layout-audit-fixes.css";
import "leaflet/dist/leaflet.css";
import "./home-shell-polish.css";
import "./explore-compact-polish.css";
import { Noto_Sans_KR } from "next/font/google";
import MobileBottomNav from "@/components/MobileBottomNav";
import UrgentFacilityNav from "@/components/UrgentFacilityNav";
import ExplorerSelectionAssist from "@/components/ExplorerSelectionAssist";
import NativeAppBridge from "@/components/NativeAppBridge";

const ttwittunFont = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-ttwittun", display: "swap" });

export const metadata = {
  title: "TTWITTUN · 러닝 코스 & 개인 기록",
  description:
    "대한민국 러닝 코스 탐색 · GPS 러닝 · 개인 기록 · 크루 러닝 플랫폼",
  applicationName: "TTWITTUN",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TTWITTUN",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0f12",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={ttwittunFont.variable}>
      <body>
        <div id="top" />
        {children}
        <ExplorerSelectionAssist />
        <UrgentFacilityNav />
        <MobileBottomNav />
        <NativeAppBridge />
      </body>
    </html>
  );
}
