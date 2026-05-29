import type { DashboardData, FollowerDay, IgMedia } from "./types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rnd = seeded(778899);

const CAPTIONS = [
  "Як ми зробили x4 ROAS клієнту за 30 днів",
  "3 помилки в Meta Ads, які зливають твій бюджет",
  "Чому твій креатив не залітає (і як це виправити)",
  "Розбір воронки: від кліку до продажу",
  "AI у таргеті: що реально працює у 2026",
  "Скільки коштує лід у ніші б'юті — реальні цифри",
  "Контент-стратегія, яка приносить заявки",
  "Як читати рекламний кабінет за 5 хвилин",
  "Performance vs Branding: куди вкладати гроші",
  "Зробив рекламу сам — втратив $2000. Розбір",
  "Топ-5 хуків для Reels, що працюють",
  "Як масштабувати кампанію без падіння ROAS",
  "UGC проти студійних відео: що конвертить краще",
  "Ретаргет, який повертає 40% клієнтів",
  "Чому CPM росте і що з цим робити",
  "Моя щоденна рутина медіабаєра",
  "Як ми знизили CPL удвічі за тиждень",
  "Помилка №1 початківця в Google Ads",
  "Креатив за 10 хвилин у нейромережі",
  "Що таке MER і чому це головна метрика",
  "Аудиторії, які реально працюють у 2026",
  "Як писати оффер, від якого не відмовляться",
  "Розбір реклами конкурента: що вони роблять не так",
  "Прогрів аудиторії через сторіс: схема",
  "Скільки реально заробляє агенція",
  "Автоматизація звітів для клієнтів",
  "Як ми тестуємо 50 креативів за день",
  "Чому дешеві ліди — це пастка",
  "Воронка для інфопродукту з нуля",
  "Як рахувати юніт-економіку реклами",
  "Тренди в SMM, які злетять цього року",
  "Реклама в Telegram Ads: перші результати",
  "Як зібрати команду перформанс-маркетингу",
  "Розбір кейсу: -60% ціни ліда",
  "Чому ваш сайт не продає (аудит за 3 хвилини)",
  "Найкращий час для публікації Reels",
  "AI-аватар веде мій акаунт — як це працює",
  "5 інструментів, без яких я не запускаю рекламу",
  "Як перетворити підписника на клієнта",
  "Підсумки місяця: цифри агенції відкрито",
];

const FORMATS: { mt: string; pt: IgMedia["mediaProductType"]; w: number }[] = [
  { mt: "VIDEO", pt: "REELS", w: 0.7 },
  { mt: "CAROUSEL_ALBUM", pt: "CAROUSEL_ALBUM", w: 0.2 },
  { mt: "IMAGE", pt: "FEED", w: 0.1 },
];

function pickFormat(r: number): { mt: string; pt: IgMedia["mediaProductType"] } {
  let acc = 0;
  for (const f of FORMATS) {
    acc += f.w;
    if (r <= acc) return { mt: f.mt, pt: f.pt };
  }
  return FORMATS[0];
}

function buildMedia(): IgMedia[] {
  const now = Date.now();
  const out: IgMedia[] = [];
  for (let i = 0; i < CAPTIONS.length; i++) {
    const f = pickFormat(rnd());
    const isReel = f.pt === "REELS";
    const ageDays = Math.round(2 + i * 2.2 + rnd() * 1.4); // spread over ~90 days
    const ts = new Date(now - ageDays * 86400000 - Math.floor(rnd() * 9) * 3600000);
    const hot = rnd() < 0.2; // some viral
    const reach = Math.round((isReel ? 9000 : 4200) + rnd() * (isReel ? 22000 : 7000) + (hot ? 30000 : 0));
    const views = isReel
      ? Math.round(reach * (1.5 + rnd() * 1.6))
      : Math.round(reach * (1.02 + rnd() * 0.18));
    const likeCount = Math.round(views * (0.03 + rnd() * 0.04));
    const commentsCount = Math.round(likeCount * (0.05 + rnd() * 0.09));
    const saved = Math.round(views * (0.012 + rnd() * 0.03));
    const shares = Math.round(views * (0.008 + rnd() * 0.025));
    const totalInteractions = likeCount + commentsCount + saved + shares;
    out.push({
      id: `s_${i}`,
      caption: CAPTIONS[i],
      mediaType: f.mt,
      mediaProductType: f.pt,
      permalink: "https://instagram.com/max_shapoval",
      timestamp: ts.toISOString(),
      thumbnailUrl: `https://picsum.photos/seed/maxads${i}/600/600`,
      likeCount,
      commentsCount,
      reach,
      views,
      saved,
      shares,
      totalInteractions,
      reelsAvgWatchTimeMs: isReel ? Math.round(6500 + rnd() * 14000) : undefined,
    });
  }
  return out;
}

function buildFollowerSeries(media: IgMedia[]): FollowerDay[] {
  const days = 90;
  const series: FollowerDay[] = [];
  const byDate = new Map<string, IgMedia>();
  for (const m of media) {
    const d = m.timestamp.slice(0, 10);
    if (m.mediaProductType === "REELS") byDate.set(d, m);
  }
  let followers = 22050;
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const date = day.toISOString().slice(0, 10);
    const reel = byDate.get(date);
    const base = 12 + rnd() * 28;
    const boost = reel ? Math.round((reel.views ?? 0) / 900) : 0;
    const dip = rnd() < 0.12 ? Math.round(rnd() * 22) : 0;
    const gained = Math.round(base + boost - dip);
    followers += gained;
    series.push({
      date,
      followers,
      gained,
      reelPublished: Boolean(reel),
      reelViews: reel?.views,
    });
  }
  return series;
}

export function buildSample(notice?: string): DashboardData {
  const media = buildMedia();
  const followerSeries = buildFollowerSeries(media);
  const followers = followerSeries[followerSeries.length - 1].followers;
  return {
    live: false,
    fetchedAt: new Date().toISOString(),
    notice: notice ?? "Демо-дані акаунта @max_shapoval. Підключи живий токен у .env.local для реальних цифр.",
    profile: {
      id: "17841401234567890",
      username: "max_shapoval",
      name: "Max Shapoval",
      biography:
        "Засновник MaxIco Agency · Performance-маркетинг UA/US · Реклама, AI та зростання бізнесу · Кейси та цифри відкрито",
      profilePictureUrl: "/avatar.png",
      followersCount: followers,
      followsCount: 547,
      mediaCount: 312,
    },
    media,
    followerSeries,
    demographics: {
      gender: [
        { label: "Чоловіки", value: 63 },
        { label: "Жінки", value: 37 },
      ],
      age: [
        { label: "18–24", value: 14 },
        { label: "25–34", value: 46 },
        { label: "35–44", value: 27 },
        { label: "45–54", value: 9 },
        { label: "55+", value: 4 },
      ],
      country: [
        { label: "Україна", value: 58 },
        { label: "Польща", value: 11 },
        { label: "США", value: 10 },
        { label: "Німеччина", value: 7 },
        { label: "Канада", value: 5 },
      ],
      cities: [
        { label: "Київ", value: 24 },
        { label: "Львів", value: 11 },
        { label: "Варшава", value: 8 },
        { label: "Дніпро", value: 6 },
        { label: "Одеса", value: 5 },
      ],
    },
  };
}
