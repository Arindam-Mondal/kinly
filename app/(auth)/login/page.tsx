"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type LoginInput, loginSchema } from "@/lib/validation/auth";
import { signInAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";
const errorClass = "mt-1 text-sm text-rose-600";

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
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">Log in to Kinly.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className={labelClass} htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-sm font-medium text-rose-600">Forgot?</Link>
          </div>
          <input id="password" type="password" className={inputClass} autoComplete="current-password" {...register("password")} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        {formError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        New to Kinly?{" "}
        <Link href="/register" className="font-medium text-rose-600">Create an account</Link>
      </p>
    </div>
  );
}
