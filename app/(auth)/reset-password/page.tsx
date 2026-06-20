"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { passwordStrength } from "@/lib/auth/passwordStrength";
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/validation/auth";
import { resetPasswordAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

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
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Choose a new password</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="password">New password</label>
          <input id="password" type="password" className={inputClass} autoComplete="new-password" {...register("password")} />
          <p className="mt-1 text-xs text-neutral-500">{strength.label} · at least 8 characters and a number</p>
          {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
        </div>

        {formError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
