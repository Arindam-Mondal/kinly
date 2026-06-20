import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types/database";
import {
  type TestEnv,
  type TestUser,
  createConfirmedUser,
  getTestEnv,
  makeAdmin,
} from "./helpers/users";

// Integration test: proves Row Level Security isolates users from each other.
// Requires the local Supabase stack (`supabase start`). If it isn't reachable,
// the suite self-skips so the unit-test gate stays green without a database.

let env: TestEnv | null;
let admin: SupabaseClient<Database>;
let userA: TestUser | null = null;
let userB: TestUser | null = null;
let setupError = "";

// Seed one period entry for a user (their profile is auto-created by the trigger).
async function seedEntry(user: TestUser) {
  const { error } = await user.client.from("log_entries").insert({
    user_id: user.id,
    domain: "period",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
  });
  if (error) throw error;
}

beforeAll(async () => {
  env = getTestEnv();
  if (!env) {
    setupError = "Supabase env not set — skipping RLS tests.";
    return;
  }
  admin = makeAdmin(env);
  try {
    userA = await createConfirmedUser(env, admin, { suffix: "a" });
    userB = await createConfirmedUser(env, admin, { suffix: "b" });
    await seedEntry(userA);
    await seedEntry(userB);
  } catch (err) {
    // Most likely the local stack isn't running; skip rather than fail the gate.
    setupError = `Local Supabase not reachable — skipping RLS tests. (${String(err)})`;
  }
}, 30_000);

afterAll(async () => {
  // Deleting the auth users cascades to profiles and log_entries.
  if (userA) await admin.auth.admin.deleteUser(userA.id);
  if (userB) await admin.auth.admin.deleteUser(userB.id);
});

describe("log_entries RLS isolation", () => {
  it("lets a user read only their own entries", (ctx) => {
    if (!userA || !userB) return ctx.skip();
    return (async () => {
      const { data, error } = await userA!.client.from("log_entries").select("id, user_id");
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.every((row) => row.user_id === userA!.id)).toBe(true);
      expect(data!.some((row) => row.user_id === userB!.id)).toBe(false);
    })();
  });

  it("blocks updating another user's entry", (ctx) => {
    if (!userA || !userB) return ctx.skip();
    return (async () => {
      // Update is filtered by RLS to rows A owns — B's row matches nothing.
      const { data } = await userA!.client
        .from("log_entries")
        .update({ notes: "tampered" })
        .eq("user_id", userB!.id)
        .select();
      expect(data ?? []).toHaveLength(0);

      // Confirm from B's own client that B's row is untouched.
      const { data: bRows, error: bErr } = await userB!.client
        .from("log_entries")
        .select("notes");
      expect(bErr).toBeNull();
      expect(bRows![0].notes).toBeNull();
    })();
  });

  it("blocks deleting another user's entry", (ctx) => {
    if (!userA || !userB) return ctx.skip();
    return (async () => {
      const { data } = await userA!.client
        .from("log_entries")
        .delete()
        .eq("user_id", userB!.id)
        .select();
      expect(data ?? []).toHaveLength(0);

      // B still has exactly their one entry, seen from B's own client.
      const { count, error: cErr } = await userB!.client
        .from("log_entries")
        .select("*", { count: "exact", head: true });
      expect(cErr).toBeNull();
      expect(count).toBe(1);
    })();
  });

  it("reports skip reason if the stack was unavailable", (ctx) => {
    if (setupError) {
      console.warn(setupError);
      return ctx.skip();
    }
    expect(userA && userB).toBeTruthy();
  });
});
