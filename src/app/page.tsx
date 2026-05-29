import { TrendChart } from "@/components/charts";
import { RefreshButton } from "@/components/RefreshButton";
import {
  Card,
  DemoBanner,
  DemographicsPanel,
  KpiRow,
  ProfileHeader,
  Recommendations,
  TopPosts,
} from "@/components/ui";
import { getDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { data, signals, recommendations, demo } = await getDashboard();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">IG&nbsp;Pulse</span>
            <span className="rounded-md bg-maxico-blue px-2 py-0.5 text-[11px] font-bold text-white">
              MaxIco
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Аналітика Instagram · оновлено {fmtTime(data.fetchedAt)} ·{" "}
            {demo ? "демо-дані" : "живі дані"}
          </p>
        </div>
        <RefreshButton />
      </header>

      <div className="flex flex-col gap-4">
        {demo && <DemoBanner notice={data.notice} />}

        <ProfileHeader profile={data.profile} />

        <KpiRow signals={signals} data={data} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Динаміка за 30 днів" className="lg:col-span-2">
            <TrendChart series={data.insights.series ?? []} />
            <div className="mt-2 flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm bg-[#5b8cff]" /> Охоплення
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-sm bg-maxico-lime" /> Перегляди
              </span>
            </div>
          </Card>

          <Card title="AI-рекомендації">
            <Recommendations markdown={recommendations} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Топ-публікації" className="lg:col-span-2">
            <TopPosts media={data.media} />
          </Card>

          <Card title="Аудиторія">
            <DemographicsPanel demographics={data.demographics} />
          </Card>
        </div>

        <footer className="py-4 text-center text-xs text-muted">
          IG Pulse · MaxIco Agency · поверхневий прототип ·{" "}
          {signals.bestDay}, {signals.bestHour} — найкращий слот для публікацій
        </footer>
      </div>
    </main>
  );
}
