"use client";

import { useEffect } from "react";

const LEADING_EMOJI = /^[\s\p{Extended_Pictographic}\uFE0F\u200D\u20E3\u2640-\u2642\u2600-\u27BF]+\s*/u;
const LEADING_SYMBOL = /^\s*[▶⏸■↻]\s*/u;

function cleanTextNode(node: ChildNode) {
  if (node.nodeType !== Node.TEXT_NODE) return;
  const text = node.textContent || "";
  const cleaned = text.replace(LEADING_EMOJI, "").replace(LEADING_SYMBOL, "");
  if (cleaned !== text) node.textContent = cleaned;
}

function cleanControl(element: Element) {
  element.childNodes.forEach(cleanTextNode);

  // Some legacy controls contain the emoji in a nested text-only span.
  element.querySelectorAll("span,b,strong").forEach((child) => {
    if (child.children.length === 0) child.childNodes.forEach(cleanTextNode);
  });
}

export default function RunLegacyEmojiCleanup() {
  useEffect(() => {
    const clean = () => {
      document
        .querySelectorAll(
          "button, a.btn, .runModePage a, .runModePage button, .trackStudioPage a, .trackStudioPage button, .homeDirectList a, .pageHubGrid a",
        )
        .forEach(cleanControl);

      document
        .querySelectorAll(".runModeTop h1, .runStatusCard h3, .runGuideCard b")
        .forEach(cleanControl);

      document.querySelectorAll<HTMLElement>(".runMapControl").forEach((element) => {
        cleanControl(element);
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
