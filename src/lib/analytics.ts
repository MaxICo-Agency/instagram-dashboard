import type { DashboardData, IgMedia, Signals } from "./types";

const UA_DAYS = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
];

function interactions(m: IgMedia): number {
  if (typeof m.totalInteractions === "number") return m.totalInteractions;
  return (
    m.likeCount +
    m.commentsCount +
    (m.saved ?? 0) +
    (m.shares ?? 0)
  );
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeSignals(data: DashboardData): Signals {
  const { media, profile, insights } = data;
  const series = insights.series ?? [];

  const followerGrowth30d =
    series.length >= 2
      ? (series[series.length - 1].followers ?? 0) - (series[0].followers ?? 0)
      : 0;
  const startFollowers = series[0]?.followers ?? profile.followersCount;
  const followerGrowthPct30d =
    startFollowers > 0 ? (followerGrowth30d / startFollowers) * 100 : 0;

  const perPost = media.map(interactions);
  const avgInteractionsPerPost = mean(perPost);
  // Prefer reach-based engagement when reach is present; else followers-based.
  const reachVals = media.map((m) => m.reach ?? 0).filter((x) => x > 0);
  const engagementRatePct =
    reachVals.length === media.length && reachVals.length > 0
      ? (avgInteractionsPerPost / mean(reachVals)) * 100
      : profile.followersCount > 0
        ? (avgInteractionsPerPost / profile.followersCount) * 100
        : 0;

  // Best format by avg interactions
  const byFormat = new Map<string, number[]>();
  for (const m of media) {
    const k = m.mediaProductType;
    byFormat.set(k, [...(byFormat.get(k) ?? []), interactions(m)]);
  }
  let bestFormat = "FEED";
  let bestFormatAvg = 0;
  for (const [k, vals] of byFormat) {
    const a = mean(vals);
    if (a > bestFormatAvg) {
      bestFormatAvg = a;
      bestFormat = k;
    }
  }

  // Best day / hour by avg interactions
  const byDay = new Map<number, number[]>();
  const byHour = new Map<number, number[]>();
  for (const m of media) {
    const d = new Date(m.timestamp);
    byDay.set(d.getDay(), [...(byDay.get(d.getDay()) ?? []), interactions(m)]);
    byHour.set(d.getHours(), [...(byHour.get(d.getHours()) ?? []), interactions(m)]);
  }
  let bestDayIdx = 4;
  let bestDayAvg = 0;
  for (const [k, vals] of byDay) {
    const a = mean(vals);
    if (a > bestDayAvg) {
      bestDayAvg = a;
      bestDayIdx = k;
    }
  }
  let bestHourNum = 19;
  let bestHourAvg = 0;
  for (const [k, vals] of byHour) {
    const a = mean(vals);
    if (a > bestHourAvg) {
      bestHourAvg = a;
      bestHourNum = k;
    }
  }

  // Posting cadence
  const sorted = [...media].sort(
    (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp),
  );
  let spanDays = 30;
  if (sorted.length >= 2) {
    spanDays =
      (+new Date(sorted[sorted.length - 1].timestamp) -
        +new Date(sorted[0].timestamp)) /
        86400000 || 30;
  }
  const postsPerWeek = spanDays > 0 ? (media.length / spanDays) * 7 : media.length;

  // Top post
  let top = media[0];
  for (const m of media) if (interactions(m) > interactions(top)) top = m;

  // Reels avg watch
  const reels = media.filter((m) => m.mediaProductType === "REELS" && m.reelsAvgWatchTimeMs);
  const reelsAvgWatchSec = reels.length
    ? mean(reels.map((m) => (m.reelsAvgWatchTimeMs ?? 0) / 1000))
    : undefined;

  return {
    followers: profile.followersCount,
    followerGrowth30d,
    followerGrowthPct30d,
    reach30d: insights.reach30d,
    views30d: insights.views30d,
    engagementRatePct,
    avgInteractionsPerPost,
    bestFormat,
    bestFormatAvgInteractions: bestFormatAvg,
    bestDay: UA_DAYS[bestDayIdx],
    bestHour: `${String(bestHourNum).padStart(2, "0")}:00`,
    postsPerWeek,
    topPostCaption: top?.caption,
    topPostInteractions: top ? interactions(top) : undefined,
    topPostType: top?.mediaProductType,
    reelsAvgWatchSec,
    profileLinkTaps: insights.profileLinksTaps,
  };
}

export function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(Math.round(n));
}
