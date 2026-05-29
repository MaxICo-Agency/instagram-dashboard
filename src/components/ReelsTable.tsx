"use client";

import { useMemo, useState } from "react";
import { er, formatNumber } from "@/lib/analytics";
import type { IgMedia } from "@/lib/types";

type SortKey = "views" | "er" | "saved" | "shares" | "likes" | "reach" | "date";
type Filter = "all" | "REELS" | "FEED" | "CAROUSEL_ALBUM";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "views", label: "Перегляди" },
  { key: "er", label: "ER %" },
  { key: "saved", label: "Збереження" },
  { key: "shares", label: "Поширення" },
  { key: "likes", label: "Лайки" },
  { key: "reach", label: "Охоплення" },
  { key: "date", label: "Дата" },
];

const TYPE_LABEL: Record<string, string> = {
  REELS: "Reels",
  FEED: "Пост",
  CAROUSEL_ALBUM: "Карусель",
  STORY: "Stories",
};

function erBadge(v: number) {
  if (v >= 5) return "bg-maxico-lime/15 text-maxico-lime";
  if (v >= 2) return "bg-amber-400/15 text-amber-300";
  return "bg-red-500/15 text-red-300";
}

export function ReelsTable({ media }: { media: IgMedia[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("views");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    let list = media;
    if (filter !== "all") list = list.filter((m) => m.mediaProductType === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((m) => (m.caption ?? "").toLowerCase().includes(s));
    }
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "er": return er(b) - er(a);
        case "saved": return (b.saved ?? 0) - (a.saved ?? 0);
        case "shares": return (b.shares ?? 0) - (a.shares ?? 0);
        case "likes": return b.likeCount - a.likeCount;
        case "reach": return (b.reach ?? 0) - (a.reach ?? 0);
        case "date": return +new Date(b.timestamp) - +new Date(a.timestamp);
        default: return (b.views ?? 0) - (a.views ?? 0);
      }
    });
    return sorted;
  }, [media, q, sort, filter]);

  const maxViews = useMemo(() => Math.max(1, ...media.map((m) => m.views ?? 0)), [media]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук за підписом…"
          className="min-w-[180px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white focus:border-maxico-lime focus:outline-none"
        >
          <option value="all">Усі типи</option>
          <option value="REELS">Reels</option>
          <option value="CAROUSEL_ALBUM">Каруселі</option>
          <option value="FEED">Пости</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white focus:border-maxico-lime focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Сортувати: {s.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Дата</th>
              <th className="px-3 py-2.5">Підпис</th>
              <th className="px-3 py-2.5">👁 Перегляди</th>
              <th className="px-3 py-2.5">👥 Охоп.</th>
              <th className="px-3 py-2.5">❤️</th>
              <th className="px-3 py-2.5">🔖</th>
              <th className="px-3 py-2.5">📤</th>
              <th className="px-3 py-2.5">ER%</th>
              <th className="px-3 py-2.5">↗</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const e = er(m);
              return (
                <tr key={m.id} className="border-t border-line/60 hover:bg-surface-2/50">
                  <td className="px-3 py-2.5 text-muted">{i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{m.timestamp.slice(0, 10)}</td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-maxico-lime">
                        {TYPE_LABEL[m.mediaProductType] || m.mediaProductType}
                      </span>
                      <span className="truncate text-white/90" title={m.caption}>{m.caption}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-white">{formatNumber(m.views)}</div>
                    <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-[#5b8cff]" style={{ width: `${((m.views ?? 0) / maxViews) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-white/80">{formatNumber(m.reach)}</td>
                  <td className="px-3 py-2.5 text-white/80">{formatNumber(m.likeCount)}</td>
                  <td className="px-3 py-2.5 text-white/80">{formatNumber(m.saved)}</td>
                  <td className="px-3 py-2.5 text-white/80">{formatNumber(m.shares)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${erBadge(e)}`}>{e.toFixed(1)}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <a href={m.permalink || "#"} target="_blank" rel="noreferrer" className="text-muted hover:text-maxico-lime">↗</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{rows.length} публікацій</p>
    </div>
  );
}
