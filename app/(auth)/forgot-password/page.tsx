"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/validation/auth";
import { forgotPasswordAction } from "../actions";

const inputClass =
  "w-full rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-sm font-medium text-ink/80";

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
      <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink/70">We&apos;ll email you a link to set a new one.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
        </div>

        {message && <p className="rounded-2xl bg-accent/15 p-3 text-sm text-ink">{message}</p>}
        {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/70">
        <Link href="/login" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-2">Back to log in</Link>
      </p>
    </div>
  );
}
