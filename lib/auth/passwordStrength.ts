export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
};

const LABELS: PasswordStrength["label"][] = [
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
];

// A lightweight strength estimate for the registration meter — UX guidance only,
// not the validation gate (that lives in the Zod schema). Points for length and
// character variety.
export function passwordStrength(password: string): PasswordStrength {
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[0-9]/.test(password)) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;

  // Anything under the 8-char minimum can never read above "Weak".
  const score = (password.length < 8 ? Math.min(points, 1) : Math.min(points, 4)) as PasswordStrength["score"];
  return { score, label: LABELS[score] };
}
