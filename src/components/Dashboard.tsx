"use client";

import { useState } from "react";
import { er, formatNumber } from "@/lib/analytics";
import type { Analytics, DashboardData, Signals } from "@/lib/types";
import {
  BucketBars,
  DistBars,
  FollowerGrowth,
  GainScatter,
  HBars,
  MonthlyTrend,
  SavesShares,
  ViewsTrend,
  WeekdayBars,
} from "./charts";
import { ReelsTable } from "./ReelsTable";
import { RefreshButton } from "./RefreshButton";
import { LogoutButton } from "./LogoutButton";
import {
  Card,
  DemoBanner,
  DemographicsBlocks,
  Kpi,
  MediaMiniList,
  ProfileHeader,
  Recommendations,
  StatStrip,
} from "./ui";

const TABS = ["Огляд", "Публікації", "Підписники", "Інсайти", "Аудиторія", "AI-поради"] as const;
type Tab = (typeof TABS)[number];

const cap = (s: string | undefined, n = 30) => (!s ? "—" : s.length > n ? s.slice(0, n) + "…" : s);

export function Dashboard({
  data,
  analytics,
  recommendations,
  demo,
}: {
  data: DashboardData;
  analytics: Analytics;
  signals: Signals;
  recommendations: string;
  demo: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Огляд");
  const k = analytics.kpis;

  const topViews = analytics.topByViews.slice(0, 12).map((m) => ({ label: cap(m.caption, 26), value: m.views ?? 0 }));
  const topER = analytics.topByER.slice(0, 12).map((m) => ({ label: cap(m.caption, 26), value: Number(er(m).toFixed(1)) }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">Instagram&nbsp;Dashboard</span>
            <span className="rounded-md bg-maxico-blue px-2 py-0.5 text-[11px] font-bold text-white">MaxIco</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(data.fetchedAt).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {demo ? "демо-дані" : "живі дані"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {demo && <DemoBanner notice={data.notice} />}
        <ProfileHeader profile={data.profile} />

        <nav className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                tab === t ? "bg-maxico-lime text-ink" : "border border-line bg-surface-2 text-white/80 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "Огляд" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Reels" value={formatNumber(k.reels)} sub={`+${k.posts} інших`} />
              <Kpi label="Σ Перегляди" value={formatNumber(k.totalViews)} />
              <Kpi label="Σ Охоплення" value={formatNumber(k.totalReach)} />
              <Kpi label="Сер. перегляди" value={formatNumber(k.avgViews)} />
              <Kpi label="Сер. ER" value={`${k.avgER}%`} />
              <Kpi label="Σ Збереження" value={formatNumber(k.totalSaves)} />
              <Kpi label="Σ Поширення" value={formatNumber(k.totalShares)} />
              <Kpi label="Підписники" value={formatNumber(k.followers)} sub={`+${k.followerGrowth30d} / 30д`} positive={k.followerGrowth30d >= 0} />
            </div>
            <StatStrip
              items={[
                { label: "Кращий день", value: analytics.bestDay },
                { label: "Кращий час", value: analytics.bestHour },
                { label: "Кращий формат", value: analytics.bestFormat },
                { label: "Постів/тиждень", value: String(analytics.postsPerWeek) },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card title="Перегляди в часі" subtitle="по публікаціях + сер. за 5" className="lg:col-span-2">
                <ViewsTrend data={analytics.viewsTrend} />
              </Card>
              <Card title="Топ за переглядами">
                <HBars data={topViews} color="#5b8cff" height={300} />
              </Card>
            </div>
          </>
        )}

        {tab === "Публікації" && (
          <Card title="Усі публікації" subtitle="пошук, фільтр за типом, сортування">
            <ReelsTable media={data.media} />
          </Card>
        )}

        {tab === "Підписники" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Підписники" value={formatNumber(k.followers)} />
              <Kpi label="Приріст 30д" value={`+${formatNumber(k.followerGrowth30d)}`} sub={`${k.followerGrowthPct30d.toFixed(1)}%`} positive />
              <Kpi label="Сер. приріст/день" value={formatNumber(Math.round(k.followerGrowth30d / 30))} />
              <Kpi label="Тапи по лінках" value={formatNumber(k.profileLinkTaps)} />
            </div>
            <Card title="Приріст підписників" subtitle="лаймом — дні з публікацією Reels">
              <FollowerGrowth data={data.followerSeries} />
            </Card>
            <Card title="Перегляди Reels → приріст того ж дня" subtitle="кореляція контенту і підписок">
              <GainScatter data={analytics.scatter} />
            </Card>
          </>
        )}

        {tab === "Інсайти" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Сер. перегляди за днем тижня" subtitle="лаймом — найкращий день">
              <WeekdayBars data={analytics.weekday} />
            </Card>
            <Card title="Місячна динаміка" subtitle="сер. перегляди + ER%">
              <MonthlyTrend data={analytics.monthly} />
            </Card>
            <Card title="Збереження vs Поширення" subtitle="топ публікації">
              <SavesShares data={analytics.savesVsShares.slice(0, 12)} />
            </Card>
            <Card title="Розподіл за переглядами">
              <DistBars data={analytics.distribution} />
            </Card>
            <Card title="Топ за ER%">
              <HBars data={topER} color="#b8f700" height={300} />
            </Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card title="Найбільше збережень">
                <MediaMiniList media={analytics.topSaved} metric="saved" />
              </Card>
              <Card title="Найбільше поширень">
                <MediaMiniList media={analytics.topShared} metric="shares" />
              </Card>
            </div>
          </div>
        )}

        {tab === "Аудиторія" && (
          <>
            <Card title="Демографія аудиторії">
              <DemographicsBlocks demographics={data.demographics} />
            </Card>
            {data.demographics.age && (
              <Card title="Вік аудиторії">
                <BucketBars data={data.demographics.age} />
              </Card>
            )}
          </>
        )}

        {tab === "AI-поради" && (
          <Card title="AI-рекомендації" subtitle="OpenAI gpt-4.1 на основі ваших метрик">
            <Recommendations markdown={recommendations} />
          </Card>
        )}
      </div>
    </main>
  );
}
