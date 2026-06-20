import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { Sex } from "@/lib/validation/auth";

// Shared helpers for integration tests that run against the local Supabase stack.

export type TestEnv = { url: string; anonKey: string; serviceKey: string };

export function getTestEnv(): TestEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return null;
  return { url, anonKey, serviceKey };
}

export function makeAdmin(env: TestEnv): SupabaseClient<Database> {
  return createClient<Database>(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
};

type CreateOpts = { suffix: string; name?: string; age?: number; sex?: Sex };

// Creates a confirmed auth user with sign-up metadata (which the handle_new_user
// trigger turns into a profiles row) and returns a client signed in as that user.
export async function createConfirmedUser(
  env: TestEnv,
  admin: SupabaseClient<Database>,
  { suffix, name = "Test User", age = 30, sex = "female" }: CreateOpts,
): Promise<TestUser> {
  const email = `test-${Date.now()}-${suffix}@example.com`;
  const password = "password123";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, age, sex },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");

  const client = createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { id: data.user.id, email, password, client };
}
