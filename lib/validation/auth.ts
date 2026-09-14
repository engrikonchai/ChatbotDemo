import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;

export const emailSchema = z.email({ message: "Enter a valid email address." });
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Enter your password." }),
});

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(1, { message: "Enter your name." }).max(200),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
