import type {
  AccountInsights,
  DashboardData,
  Demographics,
  IgMedia,
  IgProfile,
} from "./types";

const HOST = "https://graph.instagram.com";
const V = process.env.IG_GRAPH_VERSION || "v21.0";
const TOKEN = process.env.IG_ACCESS_TOKEN || "";

let lastError: string | null = null;
export function getLastError() {
  return lastError;
}
export function hasLiveConfig() {
  return Boolean(TOKEN);
}

async function ig<T = unknown>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${HOST}/${V}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || (json && json.error)) {
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  }
  return json as T;
}

// Insights require the instagram_business_manage_insights scope; failures are
// non-fatal — we degrade gracefully and keep whatever we already fetched.
async function accountInsightsSafe(igId: string): Promise<AccountInsights> {
  const out: AccountInsights = {};
  try {
    const r = await ig<{ data: { name: string; total_value?: { value: number } }[] }>(
      `${igId}/insights`,
      { metric: "reach,views,accounts_engaged,total_interactions", period: "day", metric_type: "total_value" },
    );
    for (const m of r.data || []) {
      const v = m.total_value?.value;
      if (m.name === "reach") out.reach30d = v;
      if (m.name === "views") out.views30d = v;
      if (m.name === "accounts_engaged") out.accountsEngaged = v;
      if (m.name === "total_interactions") out.totalInteractions = v;
    }
  } catch (e) {
    lastError = (e as Error).message;
  }
  return out;
}

async function demographicsSafe(): Promise<Demographics> {
  // Lifetime demographics need extra scope + 100+ followers; best-effort only.
  return {};
}

export async function fetchLive(): Promise<DashboardData | null> {
  lastError = null;
  if (!TOKEN) {
    lastError = "Токен не налаштовано (IG_ACCESS_TOKEN порожній).";
    return null;
  }
  try {
    const me = await ig<Record<string, unknown>>("me", {
      fields:
        "user_id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url",
    });
    const profile: IgProfile = {
      id: String(me.user_id ?? me.id ?? ""),
      username: String(me.username ?? ""),
      name: me.name as string | undefined,
      biography: me.biography as string | undefined,
      profilePictureUrl: me.profile_picture_url as string | undefined,
      followersCount: Number(me.followers_count ?? 0),
      followsCount: Number(me.follows_count ?? 0),
      mediaCount: Number(me.media_count ?? 0),
    };

    const mediaRes = await ig<{ data: Record<string, unknown>[] }>("me/media", {
      fields:
        "id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count",
      limit: "24",
    });
    const media: IgMedia[] = (mediaRes.data || []).map((m) => ({
      id: String(m.id),
      caption: m.caption as string | undefined,
      mediaType: String(m.media_type ?? ""),
      mediaProductType: (m.media_product_type as IgMedia["mediaProductType"]) ||
        (m.media_type as IgMedia["mediaProductType"]) ||
        "FEED",
      permalink: m.permalink as string | undefined,
      timestamp: String(m.timestamp ?? new Date().toISOString()),
      thumbnailUrl: (m.thumbnail_url as string) || (m.media_url as string) || undefined,
      likeCount: Number(m.like_count ?? 0),
      commentsCount: Number(m.comments_count ?? 0),
    }));

    const insights = await accountInsightsSafe(profile.id);
    const demographics = await demographicsSafe();

    return {
      live: true,
      fetchedAt: new Date().toISOString(),
      notice: lastError
        ? `Базові дані живі. Глибока аналітика недоступна: ${lastError}`
        : undefined,
      profile,
      media,
      insights,
      demographics,
    };
  } catch (e) {
    lastError = (e as Error).message;
    return null;
  }
}
