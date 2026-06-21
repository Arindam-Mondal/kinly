import { redirect } from "next/navigation";
import { todayISO } from "@/components/calendar/calendarUtils";
import { computePeriodInsights } from "@/lib/domains/period/periodInsights";
import { createClient } from "@/lib/supabase/server";
import { CalendarView, type LoggedPeriod } from "./CalendarView";

// Fetches the user's logged periods (RLS scopes to their own rows), derives the next
// predicted range, and hands both to the interactive client view.
export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("log_entries")
    .select("id, start_date, end_date, notes")
    .eq("domain", "period")
    .order("start_date", { ascending: true });

  const periods: LoggedPeriod[] = (data ?? []).map((row) => ({
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
  }));

  const insights = computePeriodInsights(periods, todayISO());
  const predicted =
    insights.predictedNextStart && insights.predictedRangeEnd
      ? { start: insights.predictedNextStart, end: insights.predictedRangeEnd }
      : null;

  return <CalendarView periods={periods} predicted={predicted} />;
}
