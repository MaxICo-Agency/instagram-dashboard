import { computeAnalytics, computeSignals } from "./analytics";
import { fetchLive, getLastError } from "./ig";
import { getRecommendations } from "./recommend";
import { buildSample } from "./sample";
import type { Analytics, DashboardData, Signals } from "./types";

export interface DashboardBundle {
  data: DashboardData;
  analytics: Analytics;
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
  if (!force && cache && Date.now() - cache.ts < TTL_MS) return cache.bundle;

  let data = await fetchLive();
  if (!data) {
    const err = getLastError();
    data = buildSample(err ? `Демо-дані @max_shapoval. Живий API недоступний: ${err}` : undefined);
  }

  const analytics = computeAnalytics(data);
  const signals = computeSignals(analytics);
  const recommendations = await getRecommendations(signals);

  const bundle: DashboardBundle = { data, analytics, signals, recommendations, demo: !data.live };
  cache = { bundle, ts: Date.now() };
  return bundle;
}
