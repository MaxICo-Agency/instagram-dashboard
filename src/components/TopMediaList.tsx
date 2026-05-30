import { er, formatNumber } from "@/lib/analytics";
import type { IgMedia } from "@/lib/types";

export function TopMediaList({ media, metric }: { media: IgMedia[]; metric: "views" | "er" }) {
  return (
    <ol className="flex flex-col gap-2">
      {media.map((m, i) => {
        const val = metric === "er" ? `${er(m).toFixed(1)}%` : formatNumber(m.views);
        return (
          <li key={m.id}>
            <a
              href={m.permalink || "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-line bg-surface-2/40 px-2.5 py-2 transition hover:border-maxico-lime"
            >
              <span className="w-4 shrink-0 text-center text-xs text-muted">{i + 1}</span>
              {m.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbnailUrl} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
              )}
              <span
                className="min-w-0 flex-1 truncate text-sm text-white/90 group-hover:text-maxico-lime"
                title={m.caption}
              >
                {m.caption || "—"}
              </span>
              <span className="shrink-0 text-sm font-semibold text-maxico-lime">{val}</span>
              <span className="shrink-0 text-muted">↗</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
