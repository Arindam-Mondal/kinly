"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { passwordStrength } from "@/lib/auth/passwordStrength";
import { SEX_VALUES, registerSchema } from "@/lib/validation/auth";
import { signUpAction } from "../actions";

type FormInput = z.input<typeof registerSchema>;
type FormOutput = z.output<typeof registerSchema>;

const SEX_LABELS: Record<(typeof SEX_VALUES)[number], string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";
const errorClass = "mt-1 text-sm text-rose-600";
const strengthColors = ["bg-neutral-200", "bg-rose-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"];

export default function RegisterPage() {
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", age: "" },
  });

  const strength = passwordStrength(String(watch("password") ?? ""));

  const onSubmit = (values: FormOutput) => {
    setFormError("");
    startTransition(async () => {
      const result = await signUpAction(values);
      if (result && "error" in result) setFormError(result.error);
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-500">Track your cycle — for yourself or someone you support.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label className={labelClass} htmlFor="name">Name</label>
          <input id="name" className={inputClass} autoComplete="name" {...register("name")} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input id="password" type="password" className={inputClass} autoComplete="new-password" {...register("password")} />
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? strengthColors[strength.score] : "bg-neutral-200 dark:bg-neutral-700"}`} />
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{strength.label} · at least 8 characters and a number</p>
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        <div className="flex gap-3">
          <div className="w-24">
            <label className={labelClass} htmlFor="age">Age</label>
            <input id="age" type="number" inputMode="numeric" className={inputClass} {...register("age")} />
          </div>
          <div className="flex-1">
            <label className={labelClass} htmlFor="sex">Sex</label>
            <select id="sex" className={inputClass} defaultValue="" {...register("sex")}>
              <option value="" disabled>Select…</option>
              {SEX_VALUES.map((value) => (
                <option key={value} value={value}>{SEX_LABELS[value]}</option>
              ))}
            </select>
          </div>
        </div>
        {(errors.age || errors.sex) && <p className={errorClass}>{errors.age?.message ?? errors.sex?.message}</p>}

        {formError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-rose-600">Log in</Link>
      </p>
    </div>
  );
}
