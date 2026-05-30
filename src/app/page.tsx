import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { SetupScreen } from "@/components/SetupScreen";
import { getDashboard } from "@/lib/data";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const jar = await cookies();
  if (!verifyToken(jar.get(SESSION_COOKIE)?.value)) redirect("/login");

  const b = await getDashboard();
  if (b.needsSetup || !b.data || !b.analytics || !b.signals) {
    return <SetupScreen error={b.error} />;
  }
  return (
    <Dashboard
      data={b.data}
      analytics={b.analytics}
      signals={b.signals}
      patterns={b.patterns}
      recommendations={b.recommendations}
      demo={b.demo}
    />
  );
}
