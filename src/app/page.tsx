import { Dashboard } from "@/components/Dashboard";
import { getDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const b = await getDashboard();
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
