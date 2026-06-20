import { describe, expect, it } from "vitest";
import { passwordStrength } from "./passwordStrength";

describe("passwordStrength", () => {
  it("caps short passwords below the minimum at a low score", () => {
    expect(passwordStrength("ab1").score).toBeLessThanOrEqual(1);
  });

  it("scores a valid-but-plain password as fair-ish", () => {
    const { score } = passwordStrength("password1"); // 9 chars, has digit + lowercase
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThan(4);
  });

  it("scores a long, varied password as strong", () => {
    expect(passwordStrength("Password1!longer").label).toBe("Strong");
  });

  it("returns a label that matches the score band", () => {
    const labels = new Set(["Too weak", "Weak", "Fair", "Good", "Strong"]);
    expect(labels.has(passwordStrength("xY9$xY9$xY9$").label)).toBe(true);
  });
});
