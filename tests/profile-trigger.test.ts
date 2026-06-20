import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types/database";
import {
  type TestEnv,
  createConfirmedUser,
  getTestEnv,
  makeAdmin,
} from "./helpers/users";

// Integration test for the handle_new_user trigger: a profiles row should be created
// automatically (and atomically) from sign-up metadata. Self-skips without the stack.

let env: TestEnv | null;
let admin: SupabaseClient<Database>;
const createdUserIds: string[] = [];
let setupError = "";

beforeAll(async () => {
  env = getTestEnv();
  if (!env) {
    setupError = "Supabase env not set — skipping trigger tests.";
    return;
  }
  admin = makeAdmin(env);
  try {
    // Connectivity probe so an unreachable stack skips rather than fails the gate.
    const { error } = await admin.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
  } catch (err) {
    setupError = `Local Supabase not reachable — skipping trigger tests. (${String(err)})`;
  }
}, 30_000);

afterEach(async () => {
  // Deleting the auth user cascades to its profile row.
  while (createdUserIds.length) {
    await admin.auth.admin.deleteUser(createdUserIds.pop()!);
  }
});

describe("handle_new_user trigger", () => {
  it("creates a matching profile from sign-up metadata", (ctx) => {
    if (setupError) return ctx.skip();
    return (async () => {
      const user = await createConfirmedUser(env!, admin, {
        suffix: "trigger",
        name: "Grace",
        age: 41,
        sex: "other",
      });
      createdUserIds.push(user.id);

      const { data, error } = await user.client
        .from("profiles")
        .select("id, name, email, age, sex")
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        id: user.id,
        name: "Grace",
        email: user.email,
        age: 41,
        sex: "other",
      });
    })();
  });

  it("fails sign-up (no orphaned user) when required metadata is missing", (ctx) => {
    if (setupError) return ctx.skip();
    return (async () => {
      // No user_metadata -> the trigger's NOT NULL insert fails -> the whole insert rolls back.
      const { data, error } = await admin.auth.admin.createUser({
        email: `test-${Date.now()}-orphan@example.com`,
        password: "password123",
        email_confirm: true,
      });
      if (data?.user) createdUserIds.push(data.user.id);
      expect(error).not.toBeNull();
    })();
  });
});
