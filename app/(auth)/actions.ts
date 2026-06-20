"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

// Actions return a result for inline display, or never return (they redirect on success).
export type FormResult = { error: string } | { success: string };

function firstError(message: string | undefined): FormResult {
  return { error: message ?? "Please check the form and try again." };
}

export async function signUpAction(input: unknown): Promise<FormResult | void> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return firstError(parsed.error.issues[0]?.message);

  const { name, email, password, age, sex } = parsed.data;
  const supabase = await createClient();
  // The handle_new_user trigger turns this metadata into the profiles row.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, age, sex } },
  });
  if (error) return { error: error.message };

  redirect("/onboarding");
}

export async function signInAction(input: unknown): Promise<FormResult | void> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return firstError(parsed.error.issues[0]?.message);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Generic message — never reveal whether the email exists.
  if (error) return { error: "Incorrect email or password." };

  redirect("/home");
}

export async function forgotPasswordAction(input: unknown): Promise<FormResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return firstError(parsed.error.issues[0]?.message);

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Always report success so the form can't be used to enumerate accounts.
  return { success: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPasswordAction(input: unknown): Promise<FormResult | void> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return firstError(parsed.error.issues[0]?.message);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/home");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
