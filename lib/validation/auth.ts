import { z } from "zod";

// Allowed sex values — mirrors the DB check constraint and drives the one sex-based
// copy branch (getDashboardCopy). Keep in sync with the migration if it ever changes.
export const SEX_VALUES = ["female", "male", "other", "prefer_not_to_say"] as const;
export type Sex = (typeof SEX_VALUES)[number];

// Spec: min 8 chars, at least one number. Supabase also enforces length 8 server-side.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  email: emailSchema,
  password: passwordSchema,
  // Form inputs arrive as strings, so coerce before range-checking.
  age: z.coerce
    .number()
    .int("Age must be a whole number")
    .min(13, "You must be at least 13 to use Kinly")
    .max(120, "Enter a valid age"),
  sex: z.enum(SEX_VALUES, { message: "Select an option" }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
