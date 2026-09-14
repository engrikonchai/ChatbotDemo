import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...props }: FormFieldProps) {
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full rounded-lg border border-navy/15 bg-warm px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:border-adriatic focus:outline-none"
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
