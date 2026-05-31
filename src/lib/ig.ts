import { getConfig, type AppConfig } from "./config";
import { loadTranscripts } from "./transcripts";
import type { Bucket, DashboardData, Demographics, FollowerDay, IgMedia, IgProfile } from "./types";

let lastError: string | null = null;
export function getLastError() {
  return lastError;
}
export async function hasLiveConfig() {
  return Boolean((await getConfig()).igToken);
}

async function igFetch<T = unknown>(cfg: AppConfig, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${cfg.igApiHost}/${cfg.igGraphVersion}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", cfg.igToken);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || (json && json.error)) throw new Error(json?.error?.message || `HTTP ${res.status}`);
  return json as T;
}

async function mediaInsightsSafe(cfg: AppConfig, id: string): Promise<Partial<IgMedia>> {
  try {
    const r = await igFetch<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(
      cfg,
      `${id}/insights`,
      { metric: "reach,views,saved,shares,total_interactions" },
    );
    const out: Partial<IgMedia> = {};
    for (const m of r.data || []) {
      const v = m.total_value?.value ?? m.values?.[0]?.value;
      if (v == null) continue;
      if (m.name === "reach") out.reach = v;
      if (m.name === "views") out.views = v;
      if (m.name === "saved") out.saved = v;
      if (m.name === "shares") out.shares = v;
      if (m.name === "total_interactions") out.totalInteractions = v;
    }
    return out;
  } catch (e) {
    lastError = (e as Error).message;
    return {};
  }
}

// follower_count (period=day) returns DAILY NEW followers. We request a 30-day
// range and rebuild the cumulative line ending at the current total.
async function followerSeriesSafe(cfg: AppConfig, node: string, media: IgMedia[], currentFollowers: number): Promise<FollowerDay[]> {
  try {
    const until = Math.floor(Date.now() / 1000);
    const since = until - 30 * 86400;
    const r = await igFetch<{ data: { values: { value: number; end_time: string }[] }[] }>(cfg, `${node}/insights`, {
      metric: "follower_count",
      period: "day",
      since: String(since),
      until: String(until),
    });
    const vals = r.data?.[0]?.values ?? [];
    const reelDates = new Set(media.filter((m) => m.mediaProductType === "REELS").map((m) => m.timestamp.slice(0, 10)));
    const out: FollowerDay[] = [];
    let totalAfter = 0;
    for (let i = vals.length - 1; i >= 0; i--) {
      const date = vals[i].end_time.slice(0, 10);
      const gained = vals[i].value || 0;
      out.unshift({ date, followers: currentFollowers - totalAfter, gained, reelPublished: reelDates.has(date) });
      totalAfter += gained;
    }
    return out;
  } catch {
    return [];
  }
}

type DemoResult = { dimension_values: string[]; value: number };
async function demographicBreakdown(cfg: AppConfig, node: string, breakdown: string): Promise<DemoResult[]> {
  try {
    const r = await igFetch<{ data: { total_value?: { breakdowns?: { results: DemoResult[] }[] } }[] }>(cfg, `${node}/insights`, {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      timeframe: "last_30_days",
      breakdown,
    });
    return r.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
  } catch {
    return [];
  }
}
function toPct(results: DemoResult[], label: (k: string) => string, top?: number): Bucket[] {
  const total = results.reduce((a, x) => a + (x.value || 0), 0) || 1;
  let b = results
    .map((x) => ({ label: label(x.dimension_values[0] ?? "?"), value: Math.round((x.value / total) * 100), raw: x.value }))
    .sort((a, b) => b.raw - a.raw);
  if (top) b = b.slice(0, top);
  return b.map(({ label, value }) => ({ label, value }));
}
const GENDER_UA: Record<string, string> = { F: "Жінки", M: "Чоловіки", U: "Не вказано" };
const COUNTRY_UA: Record<string, string> = {
  UA: "Україна", PL: "Польща", US: "США", DE: "Німеччина", GB: "Велика Британія",
  CA: "Канада", CZ: "Чехія", IT: "Італія", ES: "Іспанія", FR: "Франція", PT: "Португалія",
};
async function demographicsSafe(cfg: AppConfig, node: string): Promise<Demographics> {
  const [g, a, c, ci] = await Promise.all([
    demographicBreakdown(cfg, node, "gender"), demographicBreakdown(cfg, node, "age"),
    demographicBreakdown(cfg, node, "country"), demographicBreakdown(cfg, node, "city"),
  ]);
  const known = g.filter((x) => x.dimension_values[0] === "F" || x.dimension_values[0] === "M");
  return {
    gender: known.length ? toPct(known, (k) => GENDER_UA[k] ?? k) : undefined,
    age: a.length ? toPct(a, (k) => k).sort((x, y) => x.label.localeCompare(y.label)) : undefined,
    country: c.length ? toPct(c, (k) => COUNTRY_UA[k] ?? k, 5) : undefined,
    cities: ci.length ? toPct(ci, (k) => k.split(",")[0] || k, 5) : undefined,
  };
}

export async function fetchLive(): Promise<DashboardData | null> {
  lastError = null;
  const cfg = await getConfig();
  const node = cfg.igUserId || "me";
  if (!cfg.igToken) {
    lastError = "Токен не налаштовано (IG_ACCESS_TOKEN порожній).";
    return null;
  }
  try {
    const me = await igFetch<Record<string, unknown>>(cfg, node, {
      fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url",
    });
    const profile: IgProfile = {
      id: String(me.id ?? node),
      username: String(me.username ?? ""),
      name: me.name as string | undefined,
      biography: me.biography as string | undefined,
      profilePictureUrl: me.profile_picture_url as string | undefined,
      followersCount: Number(me.followers_count ?? 0),
      followsCount: Number(me.follows_count ?? 0),
      mediaCount: Number(me.media_count ?? 0),
    };

    const mediaRes = await igFetch<{ data: Record<string, unknown>[] }>(cfg, `${node}/media`, {
      fields:
        "id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count",
      limit: "50",
    });
    const media: IgMedia[] = (mediaRes.data || []).map((m) => ({
      id: String(m.id),
      caption: m.caption as string | undefined,
      mediaType: String(m.media_type ?? ""),
      mediaProductType:
        (m.media_product_type as IgMedia["mediaProductType"]) || (m.media_type as IgMedia["mediaProductType"]) || "FEED",
      permalink: m.permalink as string | undefined,
      timestamp: String(m.timestamp ?? new Date().toISOString()),
      thumbnailUrl: (m.thumbnail_url as string) || (m.media_url as string) || undefined,
      mediaUrl: m.media_type === "VIDEO" ? (m.media_url as string) : undefined,
      likeCount: Number(m.like_count ?? 0),
      commentsCount: Number(m.comments_count ?? 0),
    }));

    const [, followerSeries, demographics, transcripts] = await Promise.all([
      Promise.all(media.map(async (it) => Object.assign(it, await mediaInsightsSafe(cfg, it.id)))),
      followerSeriesSafe(cfg, node, media, profile.followersCount),
      demographicsSafe(cfg, node),
      loadTranscripts(),
    ]);
    for (const m of media) if (transcripts[m.id]) m.transcript = transcripts[m.id];

    return {
      live: true,
      fetchedAt: new Date().toISOString(),
      notice: lastError ? `Базові дані живі. Частина інсайтів недоступна: ${lastError}` : undefined,
      profile,
      media,
      followerSeries,
      demographics,
    };
  } catch (e) {
    lastError = (e as Error).message;
    return null;
  }
}
