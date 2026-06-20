"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type LoginInput, loginSchema } from "@/lib/validation/auth";
import { signInAction } from "../actions";

const inputClass =
  "w-full rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-sm font-medium text-ink/80";
const errorClass = "mt-1 text-sm text-[#a8412a]";

export default function LoginPage() {
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setFormError("");
    startTransition(async () => {
      const result = await signInAction(values);
      if (result && "error" in result) setFormError(result.error);
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">Log in to Kinly.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className={labelClass} htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-sm font-semibold text-ink underline decoration-accent decoration-2 underline-offset-2">Forgot?</Link>
          </div>
          <input id="password" type="password" className={inputClass} autoComplete="current-password" {...register("password")} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        {formError && <p className="rounded-2xl bg-[#a8412a]/10 p-3 text-sm text-[#a8412a]">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Kinly?{" "}
        <Link href="/register" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-2">Create an account</Link>
      </p>
    </div>
  );
}
