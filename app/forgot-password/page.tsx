"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout title="Reset your password">
        <p className="text-sm text-navy/70">
          Supabase isn&apos;t configured for this environment yet. See <code>README.md</code> for setup steps.
        </p>
      </AuthLayout>
    );
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <p className="text-sm text-navy/70">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-adriatic hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Supabase isn't configured.");
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    // Always show the same success state, whether or not the email
    // exists — never reveal which emails have accounts.
    setIsSubmitting(false);
    setSent(true);
  }

  return (
    <AuthLayout title="Reset your password" description="We'll email you a link to choose a new one.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />

        {formError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-adriatic px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-adriatic-dark disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        <p className="text-center text-sm text-navy/60">
          <Link href="/login" className="font-medium text-adriatic hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
