export function SetupScreen({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-white">Instagram&nbsp;Dashboard</span>
        <span className="rounded-md bg-maxico-blue px-2 py-0.5 text-[11px] font-bold text-white">MaxIco</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white">Потрібне підключення Instagram</h1>
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Дашборд працює лише на <span className="text-maxico-lime">реальних даних</span> — демо вимкнено.
        Додайте дійсний токен Instagram, щоб побачити аналітику акаунта.
      </p>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span className="font-semibold">Помилка API:</span> {error}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface/70 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Як підключити</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-white/90">
          <li>Переконайтеся, що акаунт — <b>Business</b> або <b>Creator</b> і прив&apos;язаний до Facebook Page.</li>
          <li>На <code className="rounded bg-surface-2 px-1.5 py-0.5 text-maxico-lime">developers.facebook.com</code> створіть/активуйте застосунок і додайте дозволи <code className="rounded bg-surface-2 px-1.5 py-0.5 text-maxico-lime">instagram_business_basic</code>, <code className="rounded bg-surface-2 px-1.5 py-0.5 text-maxico-lime">instagram_business_manage_insights</code>.</li>
          <li>У <b>Graph API Explorer</b> згенеруйте токен.</li>
          <li>Впишіть <code className="rounded bg-surface-2 px-1.5 py-0.5 text-maxico-lime">IG_ACCESS_TOKEN</code> та <code className="rounded bg-surface-2 px-1.5 py-0.5 text-maxico-lime">IG_USER_ID</code> у середовище та перезапустіть.</li>
        </ol>
        <p className="mt-4 text-xs text-muted">
          Детальна інструкція зі скриншотами — у файлі <code className="text-maxico-lime">docs/Instagram-Dashboard-Інструкція.pdf</code>.
        </p>
      </div>
    </main>
  );
}
