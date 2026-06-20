import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function InsightsPage() {
  return (
    <ComingSoon
      Icon={LineChart}
      title="Insights"
      description="Cycle-length and period-duration trends, key stats, and gentle irregularity flags."
    />
  );
}
