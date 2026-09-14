"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { signupSchema } from "@/lib/validation/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout title="Create your account" description="Set up your Adria Stay Budva dashboard">
        <p className="text-sm text-navy/70">
          Supabase isn&apos;t configured for this environment yet. See <code>README.md</code> for setup steps.
        </p>
      </AuthLayout>
    );
  }

  if (checkEmail) {
    return (
      <AuthLayout title="Check your email">
        <p className="text-sm text-navy/70">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account,
          then sign in.
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

    const parsed = signupSchema.safeParse({ displayName, email, password, confirmPassword });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Supabase isn't configured.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(error.message.includes("already registered") ? "An account with that email already exists." : "Could not create your account. Please try again.");
      return;
    }

    // Onboarding (profile + business + knowledge + widget settings) runs
    // automatically via the `handle_new_user` database trigger.
    if (data.session) {
      // Email confirmation is disabled for this project — session is live immediately.
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setCheckEmail(true);
  }

  return (
    <AuthLayout title="Create your account" description="Set up your Adria Stay Budva dashboard">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Your name"
          type="text"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm text-navy/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-adriatic hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
