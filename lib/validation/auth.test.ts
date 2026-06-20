import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

const validRegister = {
  name: "Ada",
  email: "Ada@Example.com",
  password: "password1",
  age: "30",
  sex: "female",
};

describe("registerSchema", () => {
  it("accepts a valid registration and normalizes email + age", () => {
    const result = registerSchema.parse(validRegister);
    expect(result.email).toBe("ada@example.com"); // trimmed + lowercased
    expect(result.age).toBe(30); // coerced string -> number
  });

  it("requires a password of at least 8 chars", () => {
    expect(registerSchema.safeParse({ ...validRegister, password: "pass1" }).success).toBe(false);
  });

  it("requires at least one number in the password", () => {
    expect(registerSchema.safeParse({ ...validRegister, password: "passwordx" }).success).toBe(false);
  });

  it.each([12, 121])("rejects out-of-range age %i", (age) => {
    expect(registerSchema.safeParse({ ...validRegister, age: String(age) }).success).toBe(false);
  });

  it.each([13, 120])("accepts boundary age %i", (age) => {
    expect(registerSchema.safeParse({ ...validRegister, age: String(age) }).success).toBe(true);
  });

  it("rejects an unknown sex value", () => {
    expect(registerSchema.safeParse({ ...validRegister, sex: "unknown" }).success).toBe(false);
  });

  it("rejects an empty name and an over-long name", () => {
    expect(registerSchema.safeParse({ ...validRegister, name: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegister, name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email + any non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});
