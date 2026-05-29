import type { DashboardData, IgMedia, TrendPoint } from "./types";

// Deterministic seeded pseudo-random so charts look real and stable across reloads.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const rnd = seeded(20260529);

const CAPTIONS = [
  "Реальні історії пацієнтів: -38 кг за 7 місяців 💚",
  "Що таке гастрошунтування простими словами",
  "5 міфів про баріатрію, у які досі вірять",
  "Питання-відповідь з хірургом у прямому ефірі",
  "Як змінюється життя після операції: рік потому",
  "Чек-лист підготовки до консультації",
  "Харчування в перший місяць: гайд",
  "Розбір аналізів: на що дивитися",
  "До/після: історія Олени",
  "Безкоштовний скринінг ІМТ — як записатися",
  "Топ-3 запитання від підписників цього тижня",
  "Міні-влог з клініки: один день хірурга",
  "Чому важлива підтримка психолога",
  "Результати команди за квартал — дякуємо вам!",
];

const TYPES: { mt: string; pt: IgMedia["mediaProductType"] }[] = [
  { mt: "VIDEO", pt: "REELS" },
  { mt: "IMAGE", pt: "FEED" },
  { mt: "CAROUSEL_ALBUM", pt: "CAROUSEL_ALBUM" },
  { mt: "VIDEO", pt: "REELS" },
  { mt: "IMAGE", pt: "FEED" },
  { mt: "CAROUSEL_ALBUM", pt: "CAROUSEL_ALBUM" },
];

function buildMedia(): IgMedia[] {
  const now = Date.now();
  const out: IgMedia[] = [];
  for (let i = 0; i < CAPTIONS.length; i++) {
    const t = TYPES[i % TYPES.length];
    const isReel = t.pt === "REELS";
    const ageDays = Math.round(i * 2.1 + rnd() * 1.5);
    const ts = new Date(now - ageDays * 86400000 - Math.floor(rnd() * 6) * 3600000);
    const reachBase = isReel ? 7000 : 3200;
    const reach = Math.round(reachBase + rnd() * (isReel ? 9000 : 3500));
    const views = isReel ? Math.round(reach * (1.6 + rnd() * 1.2)) : Math.round(reach * (1.05 + rnd() * 0.2));
    const likeCount = Math.round(reach * (0.04 + rnd() * 0.05));
    const commentsCount = Math.round(likeCount * (0.06 + rnd() * 0.08));
    const saved = Math.round(likeCount * (0.18 + rnd() * 0.22));
    const shares = Math.round(likeCount * (0.12 + rnd() * 0.18));
    const totalInteractions = likeCount + commentsCount + saved + shares;
    out.push({
      id: `sample_${i}`,
      caption: CAPTIONS[i],
      mediaType: t.mt,
      mediaProductType: t.pt,
      permalink: "https://instagram.com/maki.med.bariatric",
      timestamp: ts.toISOString(),
      thumbnailUrl: `https://picsum.photos/seed/makimed${i}/600/600`,
      likeCount,
      commentsCount,
      reach,
      views,
      saved,
      shares,
      totalInteractions,
      reelsAvgWatchTimeMs: isReel ? Math.round(7000 + rnd() * 11000) : undefined,
    });
  }
  return out;
}

function buildSeries(): TrendPoint[] {
  const series: TrendPoint[] = [];
  let followers = 17820;
  for (let d = 29; d >= 0; d--) {
    const day = new Date(Date.now() - d * 86400000);
    followers += Math.round(8 + rnd() * 32 - (rnd() < 0.15 ? rnd() * 18 : 0));
    series.push({
      date: day.toISOString().slice(0, 10),
      reach: Math.round(2400 + rnd() * 5200),
      views: Math.round(3600 + rnd() * 8200),
      followers,
    });
  }
  return series;
}

export function buildSample(notice?: string): DashboardData {
  const media = buildMedia();
  const series = buildSeries();
  const reach30d = series.reduce((a, p) => a + (p.reach ?? 0), 0);
  const views30d = series.reduce((a, p) => a + (p.views ?? 0), 0);
  const totalInteractions = media.reduce((a, m) => a + (m.totalInteractions ?? 0), 0);
  const followers = series[series.length - 1].followers ?? 18420;

  return {
    live: false,
    fetchedAt: new Date().toISOString(),
    notice: notice ?? "Демо-дані. Підключи живий токен у .env.local, щоб бачити реальну аналітику.",
    profile: {
      id: "17841400000000000",
      username: "maki.med.bariatric",
      name: "MaKi-Мед · Баріатрія",
      biography: "Клініка баріатричної хірургії. Зниження ваги під контролем лікарів. Консультація → запис у Direct.",
      profilePictureUrl: "https://picsum.photos/seed/makimedavatar/200/200",
      followersCount: followers,
      followsCount: 312,
      mediaCount: 487,
    },
    media,
    insights: {
      reach30d,
      views30d,
      accountsEngaged: Math.round(reach30d * 0.071),
      totalInteractions,
      profileLinksTaps: Math.round(reach30d * 0.018),
      series,
    },
    demographics: {
      gender: [
        { label: "Жінки", value: 79 },
        { label: "Чоловіки", value: 21 },
      ],
      age: [
        { label: "18–24", value: 9 },
        { label: "25–34", value: 31 },
        { label: "35–44", value: 34 },
        { label: "45–54", value: 18 },
        { label: "55+", value: 8 },
      ],
      country: [
        { label: "Україна", value: 68 },
        { label: "Польща", value: 12 },
        { label: "Німеччина", value: 7 },
        { label: "Чехія", value: 5 },
        { label: "США", value: 4 },
      ],
    },
  };
}
