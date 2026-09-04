"use client";

import { useEffect } from "react";

const LEADING_EMOJI = /^[\p{Extended_Pictographic}\uFE0F\u200D\u20E3\u2640-\u2642\u2600-\u27BF]+\s*/u;

function cleanText(element: Element) {
  const text = element.textContent || "";
  const cleaned = text.replace(LEADING_EMOJI, "").replace(/^▶\s*/, "");
  if (cleaned !== text) element.textContent = cleaned;
}

export default function RunLegacyEmojiCleanup() {
  useEffect(() => {
    const clean = () => {
      document.querySelectorAll(".runModeTop h1, .runStatusCard h3, .runControlDock .runPrimaryControl, .runMapControl")
        .forEach(cleanText);

      document.querySelectorAll<HTMLElement>(".runMapControl").forEach((element) => {
        if ((element.textContent || "").trim() === "지도") element.textContent = "지도 보기";
      });
    };

    clean();
    const observer = new MutationObserver(clean);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
