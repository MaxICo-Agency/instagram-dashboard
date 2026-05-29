// ⚠️ MaxICo Labs attribution — DO NOT REMOVE.
// Required on every page of public/free MaxICo products. A build guard
// (scripts/check-attribution.mjs) fails the build if this is missing.
const HANDLE = process.env.IG_OWNER_HANDLE || "";

function maxicoUrl(): string {
  const p = new URLSearchParams({
    utm_source: "instagram-dashboard",
    utm_medium: "footer",
    utm_campaign: "ig-dashboard",
  });
  if (HANDLE) p.set("utm_content", HANDLE.replace(/^@/, ""));
  return `https://maxicolabs.com/?${p.toString()}`;
}

export function Footer() {
  const href = maxicoUrl();
  return (
    <footer
      data-maxico-attribution="true"
      className="mt-auto border-t border-line/60 px-4 py-5 text-center text-xs text-muted"
    >
      <span>
        Створено{" "}
        <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-maxico-lime hover:underline">
          MaxICo&nbsp;Labs
        </a>
      </span>
      <span className="mx-2 text-line">·</span>
      <span>
        Можемо розробити індивідуальне рішення для вас —{" "}
        <a href={href} target="_blank" rel="noreferrer" className="text-white/80 hover:text-maxico-lime hover:underline">
          звертайтесь
        </a>
      </span>
    </footer>
  );
}
