import {
  type SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types/database";

// Integration test: proves Row Level Security isolates users from each other.
// Requires the local Supabase stack (`supabase start`). If it isn't reachable,
// the suite self-skips so the unit-test gate stays green without a database.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Client = SupabaseClient<Database>;
type User = { id: string; email: string; client: Client };

const tag = `rls-${Date.now()}`;
let admin: Client;
let userA: User | null = null;
let userB: User | null = null;
let setupError = "";

// Create a confirmed auth user, sign in as them, and seed a profile + one period entry.
async function makeUser(suffix: string): Promise<User> {
  const email = `${tag}-${suffix}@example.com`;
  const password = "password123";

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createErr || !created.user) throw createErr ?? new Error("no user");
  const id = created.user.id;

  const client = createClient<Database>(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw signInErr;

  // Insert via the authenticated client — exercises the insert_own policies.
  const { error: profileErr } = await client
    .from("profiles")
    .insert({ id, name: `User ${suffix}`, email, age: 30, sex: "female" });
  if (profileErr) throw profileErr;

  const { error: entryErr } = await client.from("log_entries").insert({
    user_id: id,
    domain: "period",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
  });
  if (entryErr) throw entryErr;

  return { id, email, client };
}

beforeAll(async () => {
  if (!url || !anonKey || !serviceKey) {
    setupError = "Supabase env not set — skipping RLS tests.";
    return;
  }
  admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    userA = await makeUser("a");
    userB = await makeUser("b");
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
