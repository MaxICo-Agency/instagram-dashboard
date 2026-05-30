import { interactions } from "./analytics";
import type { IgMedia } from "./types";

export interface LengthBucket {
  label: string;
  avgViews: number;
  er: number;
  count: number;
}
export interface WordStat {
  word: string;
  ratio: number;
}
export interface Patterns {
  hasData: boolean;
  count: number;
  avgWordCount: number;
  avgER: number;
  lengthBuckets: LengthBucket[];
  bestLength: string;
  questionVsStatement: { withQ: number; withoutQ: number };
  casualness: { high: number; low: number };
  hookWords: WordStat[];
  winnerWords: WordStat[];
  saveWords: WordStat[];
}

const STOP = new Set(
  "и в на не что я с а как это по за но из от до для так вот же бы ли о у к то все вы мы он она они там тут да нет ну уже еще или их его ее им них чтобы если когда тебе тебя меня мне мой моя твой что-то того этом этого та те та".split(
    /\s+/,
  ),
);

function words(t: string): string[] {
  return (t.toLowerCase().match(/[a-zа-яіїєґ']{3,}/giu) || []).filter((w) => !STOP.has(w));
}
function wc(t: string): number {
  return t.trim().split(/\s+/).filter(Boolean).length;
}
function mean(xs: number[]): number {
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
}
function er(m: IgMedia): number {
  const v = m.views ?? 0;
  return v > 0 ? (interactions(m) / v) * 100 : 0;
}

function freq(reels: IgMedia[], picker: (t: string) => string[]): Map<string, number> {
  const f = new Map<string, number>();
  for (const r of reels) for (const w of picker(r.transcript || "")) f.set(w, (f.get(w) || 0) + 1);
  return f;
}

function topRatio(top: IgMedia[], rest: IgMedia[], picker: (t: string) => string[], n: number): WordStat[] {
  const ft = freq(top, picker);
  const fr = freq(rest, picker);
  const totT = top.length || 1;
  const totR = rest.length || 1;
  const out: WordStat[] = [];
  for (const [w, c] of ft) {
    if (c < 2) continue;
    const pt = c / totT;
    const pr = (fr.get(w) || 0) / totR;
    const ratio = pt / (pr + 0.01);
    if (ratio > 1.2) out.push({ word: w, ratio: Math.round(ratio * 10) / 10 });
  }
  return out.sort((a, b) => b.ratio - a.ratio).slice(0, n);
}

export function computePatterns(media: IgMedia[]): Patterns {
  const reels = media.filter((m) => (m.transcript || "").length > 5 && (m.views ?? 0) > 0);
  if (reels.length < 3) {
    return {
      hasData: false, count: reels.length, avgWordCount: 0, avgER: 0, lengthBuckets: [],
      bestLength: "", questionVsStatement: { withQ: 0, withoutQ: 0 }, casualness: { high: 0, low: 0 },
      hookWords: [], winnerWords: [], saveWords: [],
    };
  }

  const buckets = [
    { label: "короткий (0–50)", lo: 0, hi: 50 },
    { label: "середній (51–100)", lo: 51, hi: 100 },
    { label: "довгий (101–150)", lo: 101, hi: 150 },
    { label: "дуже довгий (150+)", lo: 151, hi: Infinity },
  ];
  const lengthBuckets: LengthBucket[] = buckets
    .map((b) => {
      const grp = reels.filter((r) => {
        const n = wc(r.transcript!);
        return n >= b.lo && n <= b.hi;
      });
      return {
        label: b.label,
        avgViews: mean(grp.map((r) => r.views ?? 0)),
        er: Number(mean(grp.map((r) => er(r) * 10)) / 10) || 0,
        count: grp.length,
      };
    })
    .filter((b) => b.count > 0);
  const bestLength = lengthBuckets.length
    ? lengthBuckets.reduce((a, b) => (b.avgViews > a.avgViews ? b : a)).label
    : "";

  const withQ = reels.filter((r) => /[?]/.test(r.transcript!.split(/[.!?]/)[0] || ""));
  const withoutQ = reels.filter((r) => !withQ.includes(r));

  const CASUAL = /\b(блять|бля|нахуй|хуй|пизд|ебал|ебать|сука|нихуя|чувак|типа|короче|жесть)\b/iu;
  const high = reels.filter((r) => (r.transcript!.match(CASUAL) || []).length >= 2);
  const low = reels.filter((r) => !high.includes(r));

  // score for "top"
  const score = (r: IgMedia) => (r.views ?? 0) * (1 + er(r) / 100 * 5);
  const sorted = [...reels].sort((a, b) => score(b) - score(a));
  const top = sorted.slice(0, Math.max(3, Math.ceil(reels.length / 3)));
  const rest = sorted.slice(top.length);

  const hookWords = topRatio(top, rest, (t) => words(t).slice(0, 15), 8);
  const winnerWords = topRatio(top, rest, (t) => words(t), 10);

  const bySave = [...reels].sort((a, b) => (b.saved ?? 0) / (b.views ?? 1) - (a.saved ?? 0) / (a.views ?? 1));
  const saveTop = bySave.slice(0, Math.max(3, Math.ceil(reels.length / 3)));
  const saveRest = bySave.slice(saveTop.length);
  const saveWords = topRatio(saveTop, saveRest, (t) => words(t), 6);

  return {
    hasData: true,
    count: reels.length,
    avgWordCount: mean(reels.map((r) => wc(r.transcript!))),
    avgER: Number((mean(reels.map((r) => er(r) * 10)) / 10).toFixed(1)),
    lengthBuckets,
    bestLength,
    questionVsStatement: {
      withQ: mean(withQ.map((r) => r.views ?? 0)),
      withoutQ: mean(withoutQ.map((r) => r.views ?? 0)),
    },
    casualness: { high: mean(high.map((r) => r.views ?? 0)), low: mean(low.map((r) => r.views ?? 0)) },
    hookWords,
    winnerWords,
    saveWords,
  };
}
