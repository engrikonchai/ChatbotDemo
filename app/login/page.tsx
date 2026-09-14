"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { loginSchema } from "@/lib/validation/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    // Intentional one-time read of the URL query (avoids needing a
    // Suspense boundary for useSearchParams on a page that's otherwise static).
    const params = new URLSearchParams(window.location.search);
    const target = params.get("redirectTo");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (target && target.startsWith("/")) setRedirectTo(target);
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout title="Sign in" description="Owner dashboard access">
        <p className="text-sm text-navy/70">
          Supabase isn&apos;t configured for this environment yet. See <code>README.md</code> for setup steps.
        </p>
      </AuthLayout>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
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

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setIsSubmitting(false);

    if (error) {
      setFormError("Incorrect email or password.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthLayout title="Sign in" description="Owner dashboard access">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-adriatic hover:underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-navy/60 hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
