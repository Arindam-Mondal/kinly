import { redirect } from "next/navigation";
import type { CalendarEntry } from "@/lib/types/calendar";
import { PERIOD_STYLE_LOGGED } from "@/lib/domains/period/periodConfig";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./CalendarView";

// Fetches the user's logged periods (RLS scopes to their own rows) and hands them to
// the interactive client view.
export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("log_entries")
    .select("id, start_date, end_date")
    .eq("domain", "period")
    .order("start_date", { ascending: true });

  const entries: CalendarEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    styleKey: PERIOD_STYLE_LOGGED,
  }));

  return <CalendarView entries={entries} />;
}
