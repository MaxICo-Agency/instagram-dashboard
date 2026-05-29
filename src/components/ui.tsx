import type { ReactNode } from "react";
import { formatNumber } from "@/lib/analytics";
import type { DashboardData, Demographics, IgMedia, Signals } from "@/lib/types";
import { BucketBars } from "./charts";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TYPE_LABEL: Record<string, string> = {
  FEED: "Пост",
  REELS: "Reels",
  CAROUSEL_ALBUM: "Карусель",
  STORY: "Stories",
  AD: "Реклама",
};

export function Kpi({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      {sub && (
        <div
          className={`mt-1 text-sm ${
            positive === undefined
              ? "text-muted"
              : positive
                ? "text-maxico-lime"
                : "text-red-400"
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function KpiRow({ signals, data }: { signals: Signals; data: DashboardData }) {
  const g = signals.followerGrowth30d;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <Kpi
        label="Підписники"
        value={formatNumber(signals.followers)}
        sub={`${g >= 0 ? "+" : ""}${g} за 30 днів`}
        positive={g >= 0}
      />
      <Kpi label="Охоплення 30д" value={formatNumber(signals.reach30d ?? data.insights.reach30d)} />
      <Kpi label="Перегляди 30д" value={formatNumber(signals.views30d ?? data.insights.views30d)} />
      <Kpi
        label="Engagement Rate"
        value={`${signals.engagementRatePct.toFixed(1)}%`}
        sub={`${Math.round(signals.avgInteractionsPerPost)} взаємодій/пост`}
      />
      <Kpi label="Тапи по лінках" value={formatNumber(signals.profileLinkTaps)} />
    </div>
  );
}

export function ProfileHeader({ profile }: { profile: DashboardData["profile"] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur sm:flex-row sm:items-center">
      {profile.profilePictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profilePictureUrl}
          alt={profile.username}
          className="h-20 w-20 shrink-0 rounded-full border-2 border-maxico-lime object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-xl font-bold text-white">
            {profile.name || profile.username}
          </h1>
          <span className="text-sm text-muted">@{profile.username}</span>
        </div>
        {profile.biography && (
          <p className="mt-1 line-clamp-2 max-w-xl text-sm text-muted">
            {profile.biography}
          </p>
        )}
      </div>
      <div className="flex gap-6 sm:gap-8">
        <Stat label="Постів" value={formatNumber(profile.mediaCount)} />
        <Stat label="Підписників" value={formatNumber(profile.followersCount)} />
        <Stat label="Підписки" value={formatNumber(profile.followsCount)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function TopPosts({ media }: { media: IgMedia[] }) {
  const sorted = [...media]
    .sort(
      (a, b) =>
        (b.totalInteractions ?? b.likeCount + b.commentsCount) -
        (a.totalInteractions ?? a.likeCount + a.commentsCount),
    )
    .slice(0, 6);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sorted.map((m) => (
        <a
          key={m.id}
          href={m.permalink || "#"}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-xl border border-line bg-surface-2 transition hover:border-maxico-lime"
        >
          <div className="relative aspect-square overflow-hidden bg-surface">
            {m.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            )}
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-maxico-lime">
              {TYPE_LABEL[m.mediaProductType] || m.mediaProductType}
            </span>
          </div>
          <div className="p-2.5">
            <p className="line-clamp-2 h-9 text-xs text-white/90">{m.caption}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
              <span>❤ {formatNumber(m.likeCount)}</span>
              <span>💬 {formatNumber(m.commentsCount)}</span>
              {m.reach != null && <span>👁 {formatNumber(m.reach)}</span>}
              {m.saved != null && <span>🔖 {formatNumber(m.saved)}</span>}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function GenderBar({ label, value, lime }: { label: string; value: number; lime?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${lime ? "bg-maxico-lime" : "bg-[#5b8cff]"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function DemographicsPanel({ demographics }: { demographics: Demographics }) {
  const hasAny =
    (demographics.age?.length ?? 0) +
      (demographics.gender?.length ?? 0) +
      (demographics.country?.length ?? 0) >
    0;
  if (!hasAny) {
    return (
      <p className="text-sm text-muted">
        Демографія недоступна для цього токена/акаунта (потрібен scope insights та 100+ підписників).
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {demographics.gender && (
        <div className="flex flex-col gap-2">
          {demographics.gender.map((g, i) => (
            <GenderBar key={g.label} label={g.label} value={g.value} lime={i === 0} />
          ))}
        </div>
      )}
      {demographics.age && (
        <div>
          <div className="mb-2 text-xs font-medium text-muted">Вік</div>
          <BucketBars data={demographics.age} />
        </div>
      )}
      {demographics.country && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-muted">Топ країни</div>
          {demographics.country.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-white/90">{c.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-maxico-blue" style={{ width: `${c.value}%` }} />
              </div>
              <span className="w-9 text-right text-xs text-muted">{c.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/\*\*/).map((chunk, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-maxico-lime">
        {chunk}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{chunk}</span>
    ),
  );
}

export function Recommendations({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flush = () => {
    if (bullets.length) {
      const items = [...bullets];
      blocks.push(
        <ul key={`ul-${key++}`} className="mb-3 flex flex-col gap-2">
          {items.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-white/90">
              <span className="mt-1 text-maxico-lime">•</span>
              <span>{renderInline(b, `b${key}-${i}`)}</span>
            </li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("##")) {
      flush();
      blocks.push(
        <h3 key={`h-${key++}`} className="mb-2 mt-1 text-sm font-bold text-white">
          {line.replace(/^#+\s*/, "")}
        </h3>,
      );
    } else if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
      bullets.push(line.replace(/^[-•*]\s*/, ""));
    } else {
      flush();
      blocks.push(
        <p key={`p-${key++}`} className="mb-3 text-sm leading-relaxed text-white/90">
          {renderInline(line, `p${key}`)}
        </p>,
      );
    }
  }
  flush();
  return <div>{blocks}</div>;
}

export function DemoBanner({ notice }: { notice?: string }) {
  return (
    <div className="rounded-xl border border-maxico-lime/40 bg-maxico-lime/10 px-4 py-3 text-sm text-maxico-lime">
      <span className="font-semibold">Демо-режим.</span>{" "}
      {notice || "Показано приклад. Підключи живий токен у .env.local для реальних даних."}
    </div>
  );
}
