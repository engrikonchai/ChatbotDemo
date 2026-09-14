"use client";

import Link from "next/link";
import { ExternalLink, RotateCcw, UserPlus } from "lucide-react";

interface DemoControlsProps {
  onReset: () => void;
  onCreateSample: () => void;
}

export function DemoControls({ onReset, onCreateSample }: DemoControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={onCreateSample}
        className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-sand-light"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Create sample lead
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Reset all demo data? This permanently deletes every conversation, lead and hand-off for your business in Supabase.")) {
            onReset();
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-sand-light"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset demo data
      </button>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-adriatic px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-adriatic-dark"
      >
        View live website
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
