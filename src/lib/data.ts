import { computeAnalytics, computeSignals } from "./analytics";
import { fetchLive, getLastError } from "./ig";
import { getRecommendations } from "./recommend";
import { buildSample } from "./sample";
import type { Analytics, DashboardData, Signals } from "./types";

export interface DashboardBundle {
  data: DashboardData | null;
  analytics: Analytics | null;
  signals: Signals | null;
  recommendations: string;
  demo: boolean;
  needsSetup: boolean;
  error?: string;
}

// In production we never show fake numbers: set IG_REQUIRE_LIVE=1 so that
// without a valid live connection the app renders a setup screen, not demo data.
const REQUIRE_LIVE = process.env.IG_REQUIRE_LIVE === "1";

const TTL_MS = 10 * 60 * 1000;
let cache: { bundle: DashboardBundle; ts: number } | null = null;

export function resetCache() {
  cache = null;
}

export async function getDashboard(force = false): Promise<DashboardBundle> {
  if (!force && cache && Date.now() - cache.ts < TTL_MS) return cache.bundle;

  let data = await fetchLive();
  if (!data) {
    if (REQUIRE_LIVE) {
      const bundle: DashboardBundle = {
        data: null,
        analytics: null,
        signals: null,
        recommendations: "",
        demo: false,
        needsSetup: true,
        error: getLastError() ?? undefined,
      };
      cache = { bundle, ts: Date.now() };
      return bundle;
    }
    data = buildSample(getLastError() ? `Демо-дані @max_shapoval. Живий API недоступний: ${getLastError()}` : undefined);
  }

  const analytics = computeAnalytics(data);
  const signals = computeSignals(analytics);
  const recommendations = await getRecommendations(signals);

  const bundle: DashboardBundle = {
    data,
    analytics,
    signals,
    recommendations,
    demo: !data.live,
    needsSetup: false,
  };
  cache = { bundle, ts: Date.now() };
  return bundle;
}
