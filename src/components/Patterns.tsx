import { formatNumber } from "@/lib/analytics";
import type { Patterns as P } from "@/lib/patterns";

function Chips({ items, color }: { items: { word: string; ratio: number }[]; color: string }) {
  if (!items.length) return <span className="text-xs text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((w) => (
        <span key={w.word} className={`rounded-full border px-2.5 py-1 text-xs ${color}`}>
          {w.word} <span className="opacity-60">×{w.ratio}</span>
        </span>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-6 text-center text-sm text-muted">
      Потрібні транскрипти рилсів. Відкрий <span className="text-maxico-lime">⚙︎ Налаштування</span> → «Транскрибувати рилси» (Whisper).
    </div>
  );
}

export function PatternsView({ patterns }: { patterns: P | null }) {
  if (!patterns || !patterns.hasData) return <Empty />;
  const maxV = Math.max(1, ...patterns.lengthBuckets.map((b) => b.avgViews));
  const qBetter = patterns.questionVsStatement.withQ >= patterns.questionVsStatement.withoutQ;
  const casualBetter = patterns.casualness.high >= patterns.casualness.low;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface/70 p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Довжина скрипта vs перегляди</h2>
        <p className="mb-4 text-xs text-muted/70">Проаналізовано {patterns.count} рилсів · сер. {patterns.avgWordCount} слів · ER {patterns.avgER}%</p>
        <div className="flex flex-col gap-2.5">
          {patterns.lengthBuckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className={`w-36 shrink-0 text-sm ${b.label === patterns.bestLength ? "font-semibold text-maxico-lime" : "text-white/90"}`}>{b.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-surface-2">
                <div className="flex h-full items-center rounded-md bg-gradient-to-r from-maxico-blue to-[#a78bfa] px-2 text-[11px] font-semibold text-white" style={{ width: `${(b.avgViews / maxV) * 100}%` }}>
                  {formatNumber(b.avgViews)}
                </div>
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted">ER {b.er.toFixed(1)}% · {b.count} рилс</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface/70 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Питання в хуку vs ні</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${qBetter ? "border-maxico-lime/40" : "border-line"}`}>
              <div className="text-xs text-muted">З питанням</div>
              <div className="text-xl font-bold text-white">{formatNumber(patterns.questionVsStatement.withQ)}</div>
            </div>
            <div className={`rounded-xl border p-3 ${!qBetter ? "border-maxico-lime/40" : "border-line"}`}>
              <div className="text-xs text-muted">Без питання</div>
              <div className="text-xl font-bold text-white">{formatNumber(patterns.questionVsStatement.withoutQ)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface/70 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Розмовність vs нейтральність</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${casualBetter ? "border-maxico-lime/40" : "border-line"}`}>
              <div className="text-xs text-muted">Розмовний/сленг</div>
              <div className="text-xl font-bold text-white">{formatNumber(patterns.casualness.high)}</div>
            </div>
            <div className={`rounded-xl border p-3 ${!casualBetter ? "border-maxico-lime/40" : "border-line"}`}>
              <div className="text-xs text-muted">Нейтральний</div>
              <div className="text-xl font-bold text-white">{formatNumber(patterns.casualness.low)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface/70 p-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Слова-магніти в хуках топ-рилсів</h3>
        <Chips items={patterns.hookWords} color="border-maxico-lime/40 bg-maxico-lime/10 text-maxico-lime" />
        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Слова з топ-рилсів</h3>
        <Chips items={patterns.winnerWords} color="border-[#5b8cff]/40 bg-[#5b8cff]/10 text-[#9db8ff]" />
        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Слова, після яких зберігають</h3>
        <Chips items={patterns.saveWords} color="border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]" />
      </div>
    </div>
  );
}
