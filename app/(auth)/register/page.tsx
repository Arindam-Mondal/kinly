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
  "w-full rounded-2xl border border-ink/10 bg-canvas px-4 py-3 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const labelClass = "block text-sm font-medium text-ink/80";
const errorClass = "mt-1 text-sm text-danger";
const strengthColors = ["bg-ink/15", "bg-danger", "bg-amber-500", "bg-accent", "bg-accent-strong"];

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
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink/70">Track your cycle — for yourself or someone you support.</p>

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
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i < strength.score ? strengthColors[strength.score] : "bg-ink/10"}`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-ink/70">{strength.label} · at least 8 characters and a number</p>
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

        {formError && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{formError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-2">Log in</Link>
      </p>
    </div>
  );
}
