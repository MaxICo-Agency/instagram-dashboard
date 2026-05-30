"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/analytics";
import type { Patterns } from "@/lib/patterns";
import type { Analytics, DashboardData, Signals } from "@/lib/types";
import {
  BucketBars, DistBars, FollowerGrowth, GainScatter, MonthlyTrend, SavesShares, ViewsTrend, WeekdayBars,
} from "./charts";
import { ReelsTable } from "./ReelsTable";
import { RefreshButton } from "./RefreshButton";
import { LogoutButton } from "./LogoutButton";
import { Settings } from "./Settings";
import { Generator } from "./Generator";
import { PatternsView } from "./Patterns";
import { Scripts } from "./Scripts";
import { OverviewPeriod } from "./OverviewPeriod";
import { TopMediaList } from "./TopMediaList";
import { Card, DemoBanner, DemographicsBlocks, Kpi, MediaMiniList, ProfileHeader, Recommendations, StatStrip } from "./ui";

const TABS = ["Огляд", "Публікації", "Підписники", "Інсайти", "Паттерни", "Скрипти", "Генератор", "Аудиторія", "AI-поради"] as const;
type Tab = (typeof TABS)[number];

export function Dashboard({
  data, analytics, patterns, recommendations, demo,
}: {
  data: DashboardData;
  analytics: Analytics;
  signals: Signals;
  patterns: Patterns | null;
  recommendations: string;
  demo: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Огляд");
  const k = analytics.kpis;

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
          <Settings />
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
            <OverviewPeriod media={data.media} />
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
              <Card title="Топ за переглядами" subtitle="клік — відкрити пост">
                <TopMediaList media={analytics.topByViews.slice(0, 8)} metric="views" />
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
            <Card title="Сер. перегляди за днем тижня" subtitle="лаймом — найкращий день"><WeekdayBars data={analytics.weekday} /></Card>
            <Card title="Місячна динаміка" subtitle="сер. перегляди + ER%"><MonthlyTrend data={analytics.monthly} /></Card>
            <Card title="Збереження vs Поширення" subtitle="топ публікації"><SavesShares data={analytics.savesVsShares.slice(0, 12)} /></Card>
            <Card title="Розподіл за переглядами"><DistBars data={analytics.distribution} /></Card>
            <Card title="Топ за ER%" subtitle="клік — відкрити пост"><TopMediaList media={analytics.topByER.slice(0, 8)} metric="er" /></Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card title="Найбільше збережень"><MediaMiniList media={analytics.topSaved} metric="saved" /></Card>
              <Card title="Найбільше поширень"><MediaMiniList media={analytics.topShared} metric="shares" /></Card>
            </div>
          </div>
        )}

        {tab === "Паттерни" && <PatternsView patterns={patterns} />}
        {tab === "Скрипти" && <Scripts media={data.media} />}
        {tab === "Генератор" && <Generator />}

        {tab === "Аудиторія" && (
          <>
            <Card title="Демографія аудиторії"><DemographicsBlocks demographics={data.demographics} /></Card>
            {data.demographics.age && <Card title="Вік аудиторії"><BucketBars data={data.demographics.age} /></Card>}
          </>
        )}

        {tab === "AI-поради" && (
          <Card title="AI-рекомендації" subtitle="OpenAI на основі ваших метрик"><Recommendations markdown={recommendations} /></Card>
        )}
      </div>
    </main>
  );
}
