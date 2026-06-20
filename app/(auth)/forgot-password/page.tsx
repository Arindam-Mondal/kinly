"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/validation/auth";
import { forgotPasswordAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if ("error" in result) setError(result.error);
      else setMessage(result.success);
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Reset your password</h1>
      <p className="mt-1 text-sm text-neutral-500">We&apos;ll email you a link to set a new one.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
        </div>

        {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40">{message}</p>}
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-rose-600">Back to log in</Link>
      </p>
    </div>
  );
}
