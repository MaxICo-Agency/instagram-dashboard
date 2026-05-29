import { computeSignals } from "./analytics";
import { fetchLive, getLastError } from "./ig";
import { getRecommendations } from "./recommend";
import { buildSample } from "./sample";
import type { DashboardData, Signals } from "./types";

export interface DashboardBundle {
  data: DashboardData;
  signals: Signals;
  recommendations: string;
  demo: boolean;
}

const TTL_MS = 10 * 60 * 1000;
let cache: { bundle: DashboardBundle; ts: number } | null = null;

export function resetCache() {
  cache = null;
}

export async function getDashboard(force = false): Promise<DashboardBundle> {
  if (!force && cache && Date.now() - cache.ts < TTL_MS) {
    return cache.bundle;
  }

  let data = await fetchLive();
  if (!data) {
    const err = getLastError();
    const notice = err
      ? `Демо-дані. Живий API недоступний: ${err}`
      : undefined;
    data = buildSample(notice);
  }

  const signals = computeSignals(data);
  const recommendations = await getRecommendations(signals);
  const bundle: DashboardBundle = {
    data,
    signals,
    recommendations,
    demo: !data.live,
  };
  cache = { bundle, ts: Date.now() };
  return bundle;
}
