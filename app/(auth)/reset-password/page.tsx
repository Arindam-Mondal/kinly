"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { passwordStrength } from "@/lib/auth/passwordStrength";
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/validation/auth";
import { resetPasswordAction } from "../actions";

const inputClass =
  "w-full rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-sm font-medium text-ink/80";

export default function ResetPasswordPage() {
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  const strength = passwordStrength(watch("password") ?? "");

  const onSubmit = (values: ResetPasswordInput) => {
    setFormError("");
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      if (result && "error" in result) setFormError(result.error);
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Choose a new password</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="password">New password</label>
          <input id="password" type="password" className={inputClass} autoComplete="new-password" {...register("password")} />
          <p className="mt-1 text-xs text-ink/70">{strength.label} · at least 8 characters and a number</p>
          {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
        </div>

        {formError && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
