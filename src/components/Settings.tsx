"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = { running: boolean; total: number; done: number; error?: string };
type Cfg = { igTokenSet: boolean; igToken: string; igUserId: string; openaiKeySet: boolean; openaiKey: string };

export function Settings() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [igToken, setIgToken] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [saved, setSaved] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const [s, c] = await Promise.all([fetch("/api/transcribe"), fetch("/api/settings")]);
      if (s.ok) setStatus(await s.json());
      if (c.ok) setCfg(await c.json());
    } catch {}
  }

  async function saveKeys() {
    setSaved("Зберігаю…");
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ igToken, igUserId, openaiKey }),
    });
    setSaved(r.ok ? "Збережено ✓" : "Помилка");
    setIgToken("");
    setOpenaiKey("");
    await load();
    await fetch("/api/refresh", { method: "POST" });
    router.refresh();
  }

  async function startTranscribe() {
    await fetch("/api/transcribe", { method: "POST" });
    await load();
    if (!poll.current) {
      poll.current = setInterval(async () => {
        const r = await fetch("/api/transcribe");
        const s: Status = await r.json();
        setStatus(s);
        if (!s.running) {
          if (poll.current) clearInterval(poll.current);
          poll.current = null;
          await fetch("/api/refresh", { method: "POST" });
          router.refresh();
        }
      }, 3000);
    }
  }

  useEffect(() => {
    if (open) load();
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [open]);

  const input = "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none";

  return (
    <>
      <button onClick={() => setOpen(true)} title="Налаштування" className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted transition hover:border-maxico-lime hover:text-maxico-lime">⚙︎</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="my-8 w-full max-w-md rounded-2xl border border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Налаштування</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-white">✕</button>
            </div>

            <div className="mb-4 rounded-xl border border-line bg-surface-2/40 p-4">
              <div className="text-sm font-semibold text-white">API-ключі</div>
              <p className="mt-1 mb-3 text-xs text-muted">Можна додати/змінити прямо тут — збережеться на сервері. Порожні поля не чіпають поточні значення.</p>

              <label className="mb-1 block text-xs text-muted">Instagram токен {cfg?.igTokenSet ? `(зараз: ${cfg.igToken})` : "(не задано)"}</label>
              <input className={input + " mb-2"} placeholder="IGAA… або EAAB…" value={igToken} onChange={(e) => setIgToken(e.target.value)} />

              <label className="mb-1 block text-xs text-muted">Instagram User ID {cfg?.igUserId ? `(зараз: ${cfg.igUserId})` : ""}</label>
              <input className={input + " mb-2"} placeholder="me або 1784…" value={igUserId} onChange={(e) => setIgUserId(e.target.value)} />

              <label className="mb-1 block text-xs text-muted">OpenAI ключ {cfg?.openaiKeySet ? `(зараз: ${cfg.openaiKey})` : "(не задано)"}</label>
              <input className={input + " mb-3"} placeholder="sk-…" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />

              <button onClick={saveKeys} className="rounded-lg bg-maxico-lime px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90">Зберегти ключі</button>
              {saved && <span className="ml-3 text-xs text-muted">{saved}</span>}
            </div>

            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <div className="text-sm font-semibold text-white">Whisper — транскрипція рилсів</div>
              <p className="mt-1 text-xs text-muted">Розшифровує мову з Reels (OpenAI). Потрібно для «Паттерни», «Скрипти», «Генератор».</p>
              {status && (
                <div className="mt-3 text-xs text-muted">
                  {status.running ? `Транскрибую… ${status.done}/${status.total}` : status.total > 0 ? `Готово: ${status.done}/${status.total}` : "Ще не запускалось"}
                  {status.error ? ` · помилка: ${status.error}` : ""}
                </div>
              )}
              <button onClick={startTranscribe} disabled={status?.running} className="mt-3 rounded-lg bg-maxico-lime px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50">
                {status?.running ? "Виконується…" : "▶ Транскрибувати рилси"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
