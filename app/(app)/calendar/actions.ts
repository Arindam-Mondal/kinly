"use server";

import { revalidatePath } from "next/cache";
import { todayISO } from "@/components/calendar/calendarUtils";
import { createClient } from "@/lib/supabase/server";
import { periodEntrySchema } from "@/lib/validation/period";

export type SaveResult = { error: string } | { ok: true };

// Inserts a period as a log_entries row (domain = 'period'). Edit/delete and the
// prediction recompute come in later build-sequence steps.
export async function createPeriodEntry(input: unknown): Promise<SaveResult> {
  const parsed = periodEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the dates." };

  const { startDate, endDate, notes } = parsed.data;
  if (endDate > todayISO()) return { error: "A period can't be logged in the future." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're not signed in." };

  const { error } = await supabase.from("log_entries").insert({
    user_id: user.id,
    domain: "period",
    start_date: startDate,
    end_date: endDate,
    notes: notes ?? null,
  });
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/calendar");
  revalidatePath("/home");
  return { ok: true };
}
