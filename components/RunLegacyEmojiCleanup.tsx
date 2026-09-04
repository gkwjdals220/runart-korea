"use client";

import { useEffect } from "react";

const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

function stripEmojiFromTextNode(node: Text) {
  const before = node.nodeValue || "";
  const after = before
    .replace(EMOJI, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "");
  if (after !== before) node.nodeValue = after;
}

function cleanElement(element: Element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  nodes.forEach(stripEmojiFromTextNode);
}

const UI_SELECTORS = [
  "button",
  ".btn",
  ".runModeTop h1",
  ".runStatusCard h3",
  ".runGuideCard b",
  ".runControlDock a",
  ".runControlDock button",
  ".startFlowHead h2",
  ".startStepTitle h3",
  ".afterRunHint a",
  ".hubTile > span",
  ".homeDirectList > a > span",
  ".interactiveTile .tileIcon",
  ".interactiveTile .runnerToken",
  ".boardCurrent > span",
  ".boardDiceButton",
  ".raceLiveCard .btn",
  ".mobileListCard .btn",
  ".quickStartGrid a",
  ".quickStartGrid button",
  ".homeQuickGrid a",
  ".homeQuickGrid button",
].join(",");

export default function RunLegacyEmojiCleanup() {
  useEffect(() => {
    const clean = () => {
      document.querySelectorAll(UI_SELECTORS).forEach(cleanElement);

      document.querySelectorAll<HTMLElement>(".runMapControl").forEach((element) => {
        const label = (element.textContent || "").trim();
        if (label === "지도") element.textContent = "지도 보기";
      });
    };

    clean();
    const observer = new MutationObserver(clean);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
