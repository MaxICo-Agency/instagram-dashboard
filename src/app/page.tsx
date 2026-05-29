import { Dashboard } from "@/components/Dashboard";
import { SetupScreen } from "@/components/SetupScreen";
import { getDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const b = await getDashboard();
  if (b.needsSetup || !b.data || !b.analytics || !b.signals) {
    return <SetupScreen error={b.error} />;
  }
  return (
    <Dashboard
      data={b.data}
      analytics={b.analytics}
      signals={b.signals}
      recommendations={b.recommendations}
      demo={b.demo}
    />
  );
}
