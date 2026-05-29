import type { ReactNode } from "react";
import { formatNumber } from "@/lib/analytics";
import type { Demographics, IgMedia, IgProfile } from "@/lib/types";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted/70">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-4 backdrop-blur">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1.5 text-2xl font-bold text-white">{value}</div>
      {sub && (
        <div className={`mt-1 text-xs ${positive === undefined ? "text-muted" : positive ? "text-maxico-lime" : "text-red-400"}`}>{sub}</div>
      )}
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

export function ProfileHeader({ profile }: { profile: IgProfile }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur sm:flex-row sm:items-center">
      {profile.profilePictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.profilePictureUrl} alt={profile.username} className="h-20 w-20 shrink-0 rounded-full border-2 border-maxico-lime object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="truncate text-xl font-bold text-white">{profile.name || profile.username}</h1>
          <span className="text-sm text-muted">@{profile.username}</span>
        </div>
        {profile.biography && <p className="mt-1 max-w-xl text-sm text-muted">{profile.biography}</p>}
      </div>
      <div className="flex gap-6 sm:gap-8">
        <Stat label="Постів" value={formatNumber(profile.mediaCount)} />
        <Stat label="Підписників" value={formatNumber(profile.followersCount)} />
        <Stat label="Підписки" value={formatNumber(profile.followsCount)} />
      </div>
    </div>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-line bg-surface-2/60 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-muted">{it.label}</div>
          <div className="mt-1 text-base font-semibold text-maxico-lime">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function MediaMiniList({ media, metric }: { media: IgMedia[]; metric: "saved" | "shares" }) {
  return (
    <ul className="flex flex-col gap-2">
      {media.map((m, i) => (
        <li key={m.id} className="flex items-center gap-3 text-sm">
          <span className="w-4 text-muted">{i + 1}</span>
          {m.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />
          )}
          <span className="min-w-0 flex-1 truncate text-white/90" title={m.caption}>{m.caption}</span>
          <span className="shrink-0 font-semibold text-maxico-lime">{formatNumber(m[metric])}</span>
        </li>
      ))}
    </ul>
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
        <div className={`h-full rounded-full ${lime ? "bg-maxico-lime" : "bg-[#5b8cff]"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ListBars({ data, color = "bg-maxico-blue" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2">
      {data.map((c) => (
        <div key={c.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-white/90">{c.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(c.value / max) * 100}%` }} />
          </div>
          <span className="w-9 text-right text-xs text-muted">{c.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function DemographicsBlocks({ demographics }: { demographics: Demographics }) {
  const has = (demographics.age?.length ?? 0) + (demographics.gender?.length ?? 0) + (demographics.country?.length ?? 0) > 0;
  if (!has) return <p className="text-sm text-muted">Демографія недоступна для цього токена (потрібен scope insights + 100+ підписників).</p>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {demographics.gender && (
        <div className="rounded-xl border border-line bg-surface-2/40 p-4">
          <div className="mb-3 text-xs font-medium text-muted">Стать</div>
          <div className="flex flex-col gap-2">
            {demographics.gender.map((g, i) => (
              <GenderBar key={g.label} label={g.label} value={g.value} lime={i === 0} />
            ))}
          </div>
        </div>
      )}
      {demographics.country && (
        <div className="rounded-xl border border-line bg-surface-2/40 p-4">
          <div className="mb-3 text-xs font-medium text-muted">Країни</div>
          <ListBars data={demographics.country} />
        </div>
      )}
      {demographics.cities && (
        <div className="rounded-xl border border-line bg-surface-2/40 p-4">
          <div className="mb-3 text-xs font-medium text-muted">Міста</div>
          <ListBars data={demographics.cities} color="bg-[#a78bfa]" />
        </div>
      )}
    </div>
  );
}

function renderInline(text: string, kp: string): ReactNode[] {
  return text.split(/\*\*/).map((c, i) =>
    i % 2 === 1 ? (
      <strong key={`${kp}-${i}`} className="font-semibold text-maxico-lime">{c}</strong>
    ) : (
      <span key={`${kp}-${i}`}>{c}</span>
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
      blocks.push(<h3 key={`h-${key++}`} className="mb-2 mt-1 text-sm font-bold text-white">{line.replace(/^#+\s*/, "")}</h3>);
    } else if (/^[-•*]/.test(line)) {
      bullets.push(line.replace(/^[-•*]\s*/, ""));
    } else {
      flush();
      blocks.push(<p key={`p-${key++}`} className="mb-3 text-sm leading-relaxed text-white/90">{renderInline(line, `p${key}`)}</p>);
    }
  }
  flush();
  return <div>{blocks}</div>;
}

export function DemoBanner({ notice }: { notice?: string }) {
  return (
    <div className="rounded-xl border border-maxico-lime/40 bg-maxico-lime/10 px-4 py-3 text-sm text-maxico-lime">
      <span className="font-semibold">Демо-режим.</span> {notice || "Приклад на акаунті @max_shapoval. Підключи живий токен у .env.local для реальних даних."}
    </div>
  );
}
