import { formatNumber } from "@/lib/analytics";
import type { IgMedia } from "@/lib/types";

export function Scripts({ media }: { media: IgMedia[] }) {
  const withText = media
    .filter((m) => (m.transcript || "").length > 5)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

  if (!withText.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface/70 p-6 text-center text-sm text-muted">
        Транскриптів ще немає. Відкрий <span className="text-maxico-lime">⚙︎ Налаштування</span> → «Транскрибувати рилси».
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {withText.map((m) => (
        <div key={m.id} className="rounded-xl border border-line bg-surface/70 p-4">
          <div className="mb-2 flex items-center gap-3">
            {m.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.thumbnailUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white/90">{m.caption || "—"}</div>
              <div className="text-xs text-muted">
                {m.timestamp.slice(0, 10)} · 👁 {formatNumber(m.views)} · 🔖 {formatNumber(m.saved)} · 📤 {formatNumber(m.shares)}
              </div>
            </div>
            <a href={m.permalink || "#"} target="_blank" rel="noreferrer" className="shrink-0 text-muted hover:text-maxico-lime">↗</a>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{m.transcript}</p>
        </div>
      ))}
    </div>
  );
}
