"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const WEIGHT_KEY = "ttwittun:body-weight-kg";
const DEFAULT_WEIGHT = 70;

function readWeight() {
  try {
    const value = Number(localStorage.getItem(WEIGHT_KEY));
    return Number.isFinite(value) && value >= 30 && value <= 200 ? value : DEFAULT_WEIGHT;
  } catch {
    return DEFAULT_WEIGHT;
  }
}

function saveWeight(value: number) {
  try {
    localStorage.setItem(WEIGHT_KEY, String(value));
  } catch {}
}

function numberFrom(text?: string | null) {
  const match = String(text || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function estimateCalories(distanceKm: number, weightKg: number, incline = 0) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  // 러닝의 실용적인 거리 기반 추정값: 약 1 kcal / kg / km.
  // 트레드밀은 경사 1%당 약 3%를 가산해 화면상의 경사 설정을 반영합니다.
  const inclineFactor = 1 + Math.max(0, incline) * 0.03;
  return Math.max(0, Math.round(distanceKm * weightKg * inclineFactor));
}

function getIncline() {
  const labels = Array.from(document.querySelectorAll<HTMLElement>(".rangeLabel"));
  const inclineLabel = labels.find((el) => el.textContent?.includes("경사도"));
  return numberFrom(inclineLabel?.querySelector("b")?.textContent || inclineLabel?.textContent);
}

function attachWeightButton(root: HTMLElement, rerender: () => void) {
  let button = root.querySelector<HTMLButtonElement>(".calorieWeightButton");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "calorieWeightButton";
    button.addEventListener("click", () => {
      const current = readWeight();
      const next = window.prompt("칼로리 계산에 사용할 체중(kg)을 입력해주세요.", String(current));
      if (next == null) return;
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed < 30 || parsed > 200) {
        window.alert("30~200kg 사이의 값을 입력해주세요.");
        return;
      }
      saveWeight(Math.round(parsed * 10) / 10);
      rerender();
    });
    root.appendChild(button);
  }
  button.textContent = `${readWeight()}kg 기준`;
}

function updateLiveRun(rerender: () => void) {
  const panel = document.querySelector<HTMLElement>(".runMetricPanel");
  if (!panel) return;
  const first = panel.querySelector<HTMLElement>(":scope > div:first-child strong");
  const km = numberFrom(first?.textContent);
  const kcal = estimateCalories(km, readWeight());
  let metric = panel.querySelector<HTMLElement>(".calorieMetricInjected");
  if (!metric) {
    metric = document.createElement("div");
    metric.className = "calorieMetricInjected";
    metric.innerHTML = "<strong>0</strong><small>예상 kcal</small>";
    panel.appendChild(metric);
  }
  const strong = metric.querySelector("strong");
  if (strong && strong.textContent !== String(kcal)) strong.textContent = String(kcal);
  attachWeightButton(metric, rerender);

  const complete = document.querySelector<HTMLElement>(".runCompleteCard .miniStats");
  if (complete) {
    let item = complete.querySelector<HTMLElement>(".calorieCompleteMetric");
    if (!item) {
      item = document.createElement("span");
      item.className = "calorieCompleteMetric";
      item.innerHTML = "<b>0 kcal</b>예상 소모";
      complete.appendChild(item);
    }
    const b = item.querySelector("b");
    if (b && b.textContent !== `${kcal} kcal`) b.textContent = `${kcal} kcal`;
  }
}

function updateTreadmill(rerender: () => void) {
  const result = document.querySelector<HTMLElement>(".treadmillResult");
  if (!result) return;
  const distanceNode = result.querySelector<HTMLElement>(":scope > div:nth-child(2) strong");
  const km = numberFrom(distanceNode?.textContent);
  const kcal = estimateCalories(km, readWeight(), getIncline());
  let metric = result.querySelector<HTMLElement>(".calorieMetricInjected");
  if (!metric) {
    metric = document.createElement("div");
    metric.className = "calorieMetricInjected treadmillCalorieMetric";
    metric.innerHTML = "<small>예상 칼로리</small><strong>0<em>kcal</em></strong>";
    result.appendChild(metric);
  }
  const strong = metric.querySelector("strong");
  if (strong) strong.innerHTML = `${kcal}<em>kcal</em>`;
  attachWeightButton(metric, rerender);
}

function updateHistory() {
  const weight = readWeight();
  document.querySelectorAll<HTMLElement>(".historyListCard").forEach((card) => {
    const metrics = card.querySelector<HTMLElement>(".historyMetrics");
    if (!metrics) return;
    const km = numberFrom(metrics.querySelector<HTMLElement>("span:first-child b")?.textContent);
    const kcal = estimateCalories(km, weight);
    let item = metrics.querySelector<HTMLElement>(".historyCalorieMetric");
    if (!item) {
      item = document.createElement("span");
      item.className = "historyCalorieMetric";
      item.innerHTML = "<b>0</b><small>kcal</small>";
      metrics.appendChild(item);
    }
    const b = item.querySelector("b");
    if (b) b.textContent = String(kcal);
  });
}

function updateDetail(rerender: () => void) {
  const stats = document.querySelector<HTMLElement>(".runRecordStats");
  if (!stats) return;
  const km = numberFrom(stats.querySelector<HTMLElement>(".stat:first-child b")?.textContent);
  const kcal = estimateCalories(km, readWeight());
  let item = stats.querySelector<HTMLElement>(".calorieDetailMetric");
  if (!item) {
    item = document.createElement("div");
    item.className = "stat calorieDetailMetric";
    item.innerHTML = "<b>0</b><span class=\"muted\">예상 kcal</span>";
    stats.appendChild(item);
  }
  const b = item.querySelector("b");
  if (b) b.textContent = String(kcal);
  attachWeightButton(item, rerender);
}

export default function RunCalorieEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    let queued = false;
    const update = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        updateLiveRun(update);
        updateTreadmill(update);
        updateHistory();
        updateDetail(update);
      });
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const timer = window.setInterval(update, 1000);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [pathname]);

  return null;
}
