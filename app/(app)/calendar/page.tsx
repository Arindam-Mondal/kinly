import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function CalendarPage() {
  return (
    <ComingSoon
      Icon={CalendarDays}
      title="Calendar"
      description="Tap to log a period range, add day notes, and see predicted dates at a glance."
    />
  );
}
