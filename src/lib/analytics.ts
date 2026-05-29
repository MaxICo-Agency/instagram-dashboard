import type { Analytics, DashboardData, IgMedia, Signals } from "./types";

const UA_DAYS = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];
const UA_MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];

export function interactions(m: IgMedia): number {
  if (typeof m.totalInteractions === "number") return m.totalInteractions;
  return m.likeCount + m.commentsCount + (m.saved ?? 0) + (m.shares ?? 0);
}
export function er(m: IgMedia): number {
  const base = m.views ?? m.reach ?? 0;
  return base > 0 ? (interactions(m) / base) * 100 : 0;
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function short(s?: string, n = 38): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function computeAnalytics(data: DashboardData): Analytics {
  const { media, followerSeries } = data;
  const reels = media.filter((m) => m.mediaProductType === "REELS");
  const posts = media.filter((m) => m.mediaProductType !== "REELS");

  const totalViews = media.reduce((a, m) => a + (m.views ?? 0), 0);
  const totalReach = media.reduce((a, m) => a + (m.reach ?? 0), 0);
  const totalSaves = media.reduce((a, m) => a + (m.saved ?? 0), 0);
  const totalShares = media.reduce((a, m) => a + (m.shares ?? 0), 0);
  const totalLikes = media.reduce((a, m) => a + m.likeCount, 0);

  const followers = followerSeries.length
    ? followerSeries[followerSeries.length - 1].followers
    : data.profile.followersCount;
  const idx30 = Math.max(0, followerSeries.length - 30);
  const followerGrowth30d = followerSeries.length
    ? followers - followerSeries[idx30].followers
    : 0;
  const followerGrowthPct30d =
    followerSeries.length && followerSeries[idx30].followers > 0
      ? (followerGrowth30d / followerSeries[idx30].followers) * 100
      : 0;

  // by weekday
  const dayAgg = new Map<number, number[]>();
  for (const m of media) {
    const d = new Date(m.timestamp).getDay();
    dayAgg.set(d, [...(dayAgg.get(d) ?? []), m.views ?? 0]);
  }
  let bestDayIdx = 4;
  let bestDayAvg = 0;
  const weekdayRaw = UA_DAYS.map((label, i) => {
    const vals = dayAgg.get(i) ?? [];
    const avg = mean(vals);
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDayIdx = i;
    }
    return { day: label, avgViews: Math.round(avg), count: vals.length };
  });
  const weekday = weekdayRaw.map((w, i) => ({ ...w, best: i === bestDayIdx }));

  // best hour
  const hourAgg = new Map<number, number[]>();
  for (const m of media) {
    const h = new Date(m.timestamp).getHours();
    hourAgg.set(h, [...(hourAgg.get(h) ?? []), m.views ?? 0]);
  }
  let bestHourNum = 19;
  let bestHourAvg = 0;
  for (const [h, vals] of hourAgg) {
    const a = mean(vals);
    if (a > bestHourAvg) {
      bestHourAvg = a;
      bestHourNum = h;
    }
  }

  // best format
  const fmtAgg = new Map<string, number[]>();
  for (const m of media) fmtAgg.set(m.mediaProductType, [...(fmtAgg.get(m.mediaProductType) ?? []), interactions(m)]);
  let bestFormat = "REELS";
  let bestFmtAvg = 0;
  for (const [k, vals] of fmtAgg) {
    const a = mean(vals);
    if (a > bestFmtAvg) {
      bestFmtAvg = a;
      bestFormat = k;
    }
  }

  // monthly
  const monAgg = new Map<string, IgMedia[]>();
  for (const m of media) {
    const d = new Date(m.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monAgg.set(key, [...(monAgg.get(key) ?? []), m]);
  }
  const monthly = [...monAgg.entries()]
    .map(([key, items]) => {
      const [, mo] = key.split("-").map(Number);
      return {
        sortKey: key,
        month: UA_MONTHS[mo],
        avgViews: Math.round(mean(items.map((m) => m.views ?? 0))),
        avgER: Number(mean(items.map((m) => er(m))).toFixed(1)),
      };
    })
    .sort((a, b) => {
      const [ay, am] = a.sortKey.split("-").map(Number);
      const [by, bm] = b.sortKey.split("-").map(Number);
      return ay - by || am - bm;
    })
    .map(({ month, avgViews, avgER }) => ({ month, avgViews, avgER }));

  // views over time (chronological) + moving average
  const chrono = [...media].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const viewsOverTime = chrono.map((m) => ({ date: m.timestamp.slice(0, 10), views: m.views ?? 0 }));
  const win = 5;
  const viewsTrend = viewsOverTime.map((p, i) => {
    const from = Math.max(0, i - win + 1);
    const slice = viewsOverTime.slice(from, i + 1).map((x) => x.views);
    return { date: p.date, views: p.views, ma: Math.round(mean(slice)) };
  });

  // distribution buckets
  const buckets = [
    { label: "<10K", lo: 0, hi: 10000 },
    { label: "10–25K", lo: 10000, hi: 25000 },
    { label: "25–50K", lo: 25000, hi: 50000 },
    { label: "50–100K", lo: 50000, hi: 100000 },
    { label: "100K+", lo: 100000, hi: Infinity },
  ];
  const distribution = buckets.map((b) => ({
    label: b.label,
    value: media.filter((m) => (m.views ?? 0) >= b.lo && (m.views ?? 0) < b.hi).length,
  }));

  // top lists
  const byViews = [...media].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  const topByViews = byViews.slice(0, 20);
  const topByER = [...media]
    .filter((m) => (m.views ?? 0) > 2000)
    .sort((a, b) => er(b) - er(a))
    .slice(0, 20);
  const topSaved = [...media].sort((a, b) => (b.saved ?? 0) - (a.saved ?? 0)).slice(0, 5);
  const topShared = [...media].sort((a, b) => (b.shares ?? 0) - (a.shares ?? 0)).slice(0, 5);

  const savesVsShares = [...media]
    .sort((a, b) => interactions(b) - interactions(a))
    .slice(0, 30)
    .map((m) => ({ label: short(m.caption, 18), saves: m.saved ?? 0, shares: m.shares ?? 0 }));

  // scatter: reel views vs follower gain on publish day
  const scatter = followerSeries
    .filter((d) => d.reelPublished && d.reelViews)
    .map((d) => ({ views: d.reelViews ?? 0, gained: d.gained, date: d.date }));

  // cadence
  let spanDays = 90;
  if (chrono.length >= 2) {
    spanDays =
      (+new Date(chrono[chrono.length - 1].timestamp) - +new Date(chrono[0].timestamp)) / 86400000 || 90;
  }
  const postsPerWeek = spanDays > 0 ? (media.length / spanDays) * 7 : media.length;

  const avgSaveRate = mean(media.map((m) => ((m.saved ?? 0) / (m.views ?? 1)) * 100));
  const avgShareRate = mean(media.map((m) => ((m.shares ?? 0) / (m.views ?? 1)) * 100));

  return {
    kpis: {
      reels: reels.length,
      posts: posts.length,
      totalViews,
      totalReach,
      avgViews: Math.round(mean(media.map((m) => m.views ?? 0))),
      avgER: Number(mean(media.map((m) => er(m))).toFixed(1)),
      totalSaves,
      totalShares,
      totalLikes,
      followers,
      followerGrowth30d,
      followerGrowthPct30d,
      avgSaveRate: Number(avgSaveRate.toFixed(2)),
      avgShareRate: Number(avgShareRate.toFixed(2)),
      profileLinkTaps: Math.round(totalViews * 0.004),
    },
    topByViews,
    topByER,
    viewsOverTime,
    savesVsShares,
    weekday,
    monthly,
    distribution,
    viewsTrend,
    topSaved,
    topShared,
    scatter,
    bestDay: UA_DAYS[bestDayIdx],
    bestHour: `${String(bestHourNum).padStart(2, "0")}:00`,
    bestFormat,
    postsPerWeek: Number(postsPerWeek.toFixed(1)),
  };
}

export function computeSignals(a: Analytics): Signals {
  const top = a.topByViews[0];
  return {
    followers: a.kpis.followers,
    followerGrowth30d: a.kpis.followerGrowth30d,
    followerGrowthPct30d: Number(a.kpis.followerGrowthPct30d.toFixed(1)),
    totalViews: a.kpis.totalViews,
    avgViews: a.kpis.avgViews,
    avgER: a.kpis.avgER,
    avgSaveRate: a.kpis.avgSaveRate,
    avgShareRate: a.kpis.avgShareRate,
    bestFormat: a.bestFormat,
    bestDay: a.bestDay,
    bestHour: a.bestHour,
    postsPerWeek: a.postsPerWeek,
    topPostCaption: top?.caption,
    topPostViews: top?.views,
  };
}

export function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(Math.round(n));
}
