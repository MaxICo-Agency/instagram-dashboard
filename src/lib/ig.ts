import type { DashboardData, Demographics, FollowerDay, IgMedia, IgProfile } from "./types";

// Works with both connection types:
//  - Instagram Login:  IG_API_HOST=https://graph.instagram.com, node = "me"
//  - Facebook Login:   IG_API_HOST=https://graph.facebook.com, IG_USER_ID = <ig-business-account-id>
const HOST = process.env.IG_API_HOST || "https://graph.instagram.com";
const V = process.env.IG_GRAPH_VERSION || "v21.0";
const TOKEN = process.env.IG_ACCESS_TOKEN || "";
const NODE = process.env.IG_USER_ID || "me";

let lastError: string | null = null;
export function getLastError() {
  return lastError;
}
export function hasLiveConfig() {
  return Boolean(TOKEN);
}

async function ig<T = unknown>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${HOST}/${V}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || (json && json.error)) throw new Error(json?.error?.message || `HTTP ${res.status}`);
  return json as T;
}

async function mediaInsightsSafe(id: string): Promise<Partial<IgMedia>> {
  try {
    const r = await ig<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(
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

async function followerSeriesSafe(media: IgMedia[]): Promise<FollowerDay[]> {
  try {
    const r = await ig<{ data: { values: { value: number; end_time: string }[] }[] }>(`${NODE}/insights`, {
      metric: "follower_count",
      period: "day",
    });
    const vals = r.data?.[0]?.values ?? [];
    const reelDates = new Set(
      media.filter((m) => m.mediaProductType === "REELS").map((m) => m.timestamp.slice(0, 10)),
    );
    let prev = 0;
    return vals.map((v, i) => {
      const date = v.end_time.slice(0, 10);
      const gained = i === 0 ? 0 : v.value - prev;
      prev = v.value;
      return { date, followers: v.value, gained, reelPublished: reelDates.has(date) };
    });
  } catch {
    return [];
  }
}

export async function fetchLive(): Promise<DashboardData | null> {
  lastError = null;
  if (!TOKEN) {
    lastError = "Токен не налаштовано (IG_ACCESS_TOKEN порожній).";
    return null;
  }
  try {
    const me = await ig<Record<string, unknown>>(NODE, {
      fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url",
    });
    const profile: IgProfile = {
      id: String(me.id ?? NODE),
      username: String(me.username ?? ""),
      name: me.name as string | undefined,
      biography: me.biography as string | undefined,
      profilePictureUrl: me.profile_picture_url as string | undefined,
      followersCount: Number(me.followers_count ?? 0),
      followsCount: Number(me.follows_count ?? 0),
      mediaCount: Number(me.media_count ?? 0),
    };

    const mediaRes = await ig<{ data: Record<string, unknown>[] }>(`${NODE}/media`, {
      fields:
        "id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count",
      limit: "30",
    });
    const media: IgMedia[] = [];
    for (const m of mediaRes.data || []) {
      const item: IgMedia = {
        id: String(m.id),
        caption: m.caption as string | undefined,
        mediaType: String(m.media_type ?? ""),
        mediaProductType:
          (m.media_product_type as IgMedia["mediaProductType"]) ||
          (m.media_type as IgMedia["mediaProductType"]) ||
          "FEED",
        permalink: m.permalink as string | undefined,
        timestamp: String(m.timestamp ?? new Date().toISOString()),
        thumbnailUrl: (m.thumbnail_url as string) || (m.media_url as string) || undefined,
        likeCount: Number(m.like_count ?? 0),
        commentsCount: Number(m.comments_count ?? 0),
      };
      Object.assign(item, await mediaInsightsSafe(item.id));
      media.push(item);
    }

    const followerSeries = await followerSeriesSafe(media);
    const demographics: Demographics = {};

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
