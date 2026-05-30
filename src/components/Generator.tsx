"use client";

import { useState } from "react";

export function Generator() {
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function gen() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, extra }),
      });
      const j = await res.json();
      if (j.error) setError(j.error);
      else setResult(j.result || "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Генератор скриптів</h2>
        <p className="mt-0.5 mb-4 text-xs text-muted/70">Claude/OpenAI вивчає твої топ-рилси (транскрипти) і пише скрипт у твоєму стилі yapping</p>
        <label className="mb-1 block text-xs text-muted">Тема рилса *</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Напр.: чому більшість зливають рекламний бюджет у перший місяць"
          className="mb-3 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none"
          rows={2}
        />
        <label className="mb-1 block text-xs text-muted">Додатково (необов'язково)</label>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Що підкреслити? Які факти включити? Який тон?"
          className="mb-3 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none"
          rows={2}
        />
        <button
          onClick={gen}
          disabled={loading || !topic.trim()}
          className="rounded-lg bg-maxico-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Генерую…" : "✨ Згенерувати скрипт"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="rounded-2xl border border-line bg-surface/70 p-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{result}</div>
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted hover:border-maxico-lime hover:text-maxico-lime"
          >
            ⧉ Копіювати
          </button>
        </div>
      )}
    </div>
  );
}
