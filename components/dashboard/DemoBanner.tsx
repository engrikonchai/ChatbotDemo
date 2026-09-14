import { ShieldAlert, Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex flex-col gap-3 border-b border-sand-dark bg-sand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-2.5 text-sm text-navy/80">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-navy/50" aria-hidden="true" />
        <p>
          <span className="font-semibold">Demo dashboard</span> — authentication will be added before
          production.
        </p>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-adriatic-light px-3 py-1 text-xs font-semibold text-adriatic-dark">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Mock AI mode
      </span>
    </div>
  );
}
