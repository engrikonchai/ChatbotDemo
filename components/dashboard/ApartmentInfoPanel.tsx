"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { KnowledgeItemRow } from "@/lib/supabase/database.types";
import type { KnowledgeItemEdit } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils/cn";

interface ApartmentInfoPanelProps {
  items: KnowledgeItemRow[];
  onSave: (id: string, edit: KnowledgeItemEdit) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

function KnowledgeItemEditorCard({
  item,
  onSave,
  onToggleActive,
}: {
  item: KnowledgeItemRow;
  onSave: (id: string, edit: KnowledgeItemEdit) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const [question, setQuestion] = useState(item.question);
  const [answerEn, setAnswerEn] = useState(item.answer_en);
  const [answerMe, setAnswerMe] = useState(item.answer_me ?? "");
  const [answerRu, setAnswerRu] = useState(item.answer_ru ?? "");

  const isDirty =
    question !== item.question || answerEn !== item.answer_en || answerMe !== (item.answer_me ?? "") || answerRu !== (item.answer_ru ?? "");

  return (
    <Card className={cn("p-5", !item.is_active && "opacity-60")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">{item.category}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-navy/60">
          <input
            type="checkbox"
            checked={item.is_active}
            onChange={(e) => onToggleActive(item.id, e.target.checked)}
            className="h-4 w-4 rounded border-navy/25 text-adriatic focus-visible:outline-adriatic"
          />
          Active
        </label>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/60">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/60">Answer (English)</label>
          <textarea
            value={answerEn}
            onChange={(e) => setAnswerEn(e.target.value)}
            rows={2}
            className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/60">Answer (Crnogorski / Srpski)</label>
            <textarea
              value={answerMe}
              onChange={(e) => setAnswerMe(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/60">Answer (Русский)</label>
            <textarea
              value={answerRu}
              onChange={(e) => setAnswerRu(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!isDirty}
        onClick={() => onSave(item.id, { question, answerEn, answerMe, answerRu })}
        className="mt-3 rounded-full bg-adriatic px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Save changes
      </button>
    </Card>
  );
}

export function ApartmentInfoPanel({ items, onSave, onToggleActive }: ApartmentInfoPanelProps) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5">
      <Card className="flex items-start gap-3 border-adriatic/20 bg-adriatic-light/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-adriatic-dark" aria-hidden="true" />
        <p className="text-sm text-navy/70">
          This is the verified knowledge stored in Supabase. Editing it here does not yet change what the live
          chat assistant says — Phase 2 keeps the deterministic mock engine&apos;s built-in answers as the
          source of truth for the public widget, so these edits are safe to try without risking an incorrect
          live answer. Reconciling the two is planned for a later phase.
        </p>
      </Card>

      {sorted.length === 0 ? (
        <Card className="p-8 text-center text-sm text-navy/55">No knowledge items found for this business.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((item) => (
            <KnowledgeItemEditorCard key={item.id} item={item} onSave={onSave} onToggleActive={onToggleActive} />
          ))}
        </div>
      )}
    </div>
  );
}
