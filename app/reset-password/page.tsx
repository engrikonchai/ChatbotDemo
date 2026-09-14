"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout title="Choose a new password">
        <p className="text-sm text-navy/70">
          Supabase isn&apos;t configured for this environment yet. See <code>README.md</code> for setup steps.
        </p>
      </AuthLayout>
    );
  }

  if (hasSession === false) {
    return (
      <AuthLayout title="This link has expired">
        <p className="text-sm text-navy/70">Request a new password reset link and try again.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-adriatic hover:underline">
          Reset password
        </Link>
      </AuthLayout>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
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

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setIsSubmitting(false);

    if (error) {
      setFormError("Could not update your password. Please request a new reset link.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={hasSession !== true}
        />
        <FormField
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          disabled={hasSession !== true}
        />

        {formError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || hasSession !== true}
          className="w-full rounded-full bg-adriatic px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-adriatic-dark disabled:opacity-60"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
