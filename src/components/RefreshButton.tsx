"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-white transition hover:border-maxico-lime hover:text-maxico-lime disabled:opacity-50"
    >
      {loading ? "Оновлюю…" : "↻ Оновити"}
    </button>
  );
}
