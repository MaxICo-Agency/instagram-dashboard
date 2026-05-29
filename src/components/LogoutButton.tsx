"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      disabled={loading}
      className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
    >
      Вийти
    </button>
  );
}
