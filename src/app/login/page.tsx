"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Помилка входу");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-white">Instagram&nbsp;Dashboard</span>
        <span className="rounded-md bg-maxico-blue px-2 py-0.5 text-[11px] font-bold text-white">MaxIco</span>
      </div>
      <h1 className="mb-1 text-xl font-bold text-white">Вхід в адмін-панель</h1>
      <p className="mb-5 text-sm text-muted">Введіть логін і пароль (з налаштувань сервера).</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Логін"
          autoComplete="username"
          className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-maxico-lime focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-maxico-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Вхід…" : "Увійти"}
        </button>
      </form>
    </main>
  );
}
