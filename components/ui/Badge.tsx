import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-adriatic-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-adriatic-dark",
        className,
      )}
      {...props}
    />
  );
}
