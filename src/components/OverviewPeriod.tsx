"use client";

import { useState } from "react";
import { formatNumber, interactions } from "@/lib/analytics";
import type { IgMedia } from "@/lib/types";

const PERIODS = [
  { label: "7 днів", days: 7 },
  { label: "30 днів", days: 30 },
  { label: "90 днів", days: 90 },
  { label: "Весь час", days: 0 },
];

function er(m: IgMedia): number {
  const v = m.views ?? 0;
  return v > 0 ? (interactions(m) / v) * 100 : 0;
}

function agg(media: IgMedia[], fromMs: number, toMs: number) {
  const g = media.filter((m) => {
    const t = +new Date(m.timestamp);
    return t >= fromMs && t < toMs;
  });
  return {
    posts: g.length,
    views: g.reduce((a, m) => a + (m.views ?? 0), 0),
    reach: g.reduce((a, m) => a + (m.reach ?? 0), 0),
    saves: g.reduce((a, m) => a + (m.saved ?? 0), 0),
    erAvg: g.length ? g.reduce((a, m) => a + er(m), 0) / g.length : 0,
  };
}

function Delta({ cur, prev }: { cur: number; prev?: number }) {
  if (prev == null) return null;
  if (!prev && !cur) return <div className="mt-1 text-xs text-muted">—</div>;
  const d = prev ? Math.round(((cur - prev) / prev) * 100) : 100;
  return (
    <div className={`mt-1 text-xs ${d >= 0 ? "text-maxico-lime" : "text-red-400"}`}>
      {d >= 0 ? "+" : ""}
      {d}% vs попер.
    </div>
  );
}

export function OverviewPeriod({ media }: { media: IgMedia[] }) {
  // Smart default: tightest standard window that actually contains posts, else "all".
  const [days, setDays] = useState<number>(() => {
    const now = Date.now();
    const has = (d: number) => media.some((m) => +new Date(m.timestamp) >= now - d * 864e5);
    return has(7) ? 7 : has(30) ? 30 : has(90) ? 90 : 0;
  });

  const now = Date.now();
  const cur = days ? agg(media, now - days * 864e5, now + 1) : agg(media, 0, now + 1);
  const prev = days ? agg(media, now - 2 * days * 864e5, now - days * 864e5) : null;

  const cards: { label: string; cur: number; prev?: number; fmt: (n: number) => string }[] = [
    { label: "Пости", cur: cur.posts, prev: prev?.posts, fmt: (n) => String(n) },
    { label: "Σ Перегляди", cur: cur.views, prev: prev?.views, fmt: formatNumber },
    { label: "Σ Охоплення", cur: cur.reach, prev: prev?.reach, fmt: formatNumber },
    { label: "Σ Збереження", cur: cur.saves, prev: prev?.saves, fmt: formatNumber },
    { label: "Сер. ER", cur: cur.erAvg, prev: prev?.erAvg, fmt: (n) => `${n.toFixed(1)}%` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => setDays(p.days)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              days === p.days ? "bg-maxico-lime text-ink" : "border border-line bg-surface-2 text-white/80 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
        {prev && <span className="ml-1 text-xs text-muted">порівняння з попереднім періодом</span>}
      </div>

      {cur.posts === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/70 p-5 text-sm text-muted">
          За цей період публікацій немає — обери ширший період (напр. <span className="text-maxico-lime">90 днів</span> або <span className="text-maxico-lime">Весь час</span>).
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-surface/70 p-4 backdrop-blur">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{c.label}</div>
              <div className="mt-1.5 text-2xl font-bold text-white">{c.fmt(c.cur)}</div>
              <Delta cur={c.cur} prev={c.prev} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
