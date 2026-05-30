"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = { running: boolean; total: number; done: number; error?: string };

export function Settings() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStatus() {
    try {
      const r = await fetch("/api/transcribe");
      if (r.ok) setStatus(await r.json());
    } catch {}
  }

  async function startTranscribe() {
    await fetch("/api/transcribe", { method: "POST" });
    await fetchStatus();
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
    if (open) fetchStatus();
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Налаштування"
        className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted transition hover:border-maxico-lime hover:text-maxico-lime"
      >
        ⚙︎
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Налаштування</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-white">✕</button>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/40 p-4">
              <div className="text-sm font-semibold text-white">Whisper — транскрипція рилсів</div>
              <p className="mt-1 text-xs text-muted">
                Розшифровує мову з твоїх Reels (OpenAI Whisper). Потрібно для вкладок «Паттерни», «Скрипти» та «Генератор».
              </p>
              {status && (
                <div className="mt-3 text-xs text-muted">
                  {status.running
                    ? `Транскрибую… ${status.done}/${status.total}`
                    : status.total > 0
                      ? `Готово: ${status.done}/${status.total}`
                      : "Ще не запускалось"}
                  {status.error ? ` · помилка: ${status.error}` : ""}
                </div>
              )}
              <button
                onClick={startTranscribe}
                disabled={status?.running}
                className="mt-3 rounded-lg bg-maxico-lime px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
              >
                {status?.running ? "Виконується…" : "▶ Транскрибувати рилси"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
