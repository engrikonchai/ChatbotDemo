"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { LANGUAGE_LABELS } from "@/lib/chat/translations";
import type { Language } from "@/lib/chat/types";
import type { BusinessRow, WidgetSettingsRow } from "@/lib/supabase/database.types";
import type { WidgetSettingsEdit } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils/cn";

const ALL_LANGUAGES: Language[] = ["en", "me", "ru"];

interface SettingsPanelProps {
  business: BusinessRow;
  widgetSettings: WidgetSettingsRow | null;
  onLanguagesChange: (languages: Language[]) => void;
  onWidgetSettingsChange: (edit: Partial<WidgetSettingsEdit>) => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-adriatic" : "bg-navy/15")}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function SettingsPanel({ business, widgetSettings, onLanguagesChange, onWidgetSettingsChange }: SettingsPanelProps) {
  const supportedLanguages = business.supported_languages as Language[];
  const [title, setTitle] = useState(widgetSettings?.title ?? "Adria Assistant");
  const [welcomeEn, setWelcomeEn] = useState(widgetSettings?.welcome_message_en ?? "");
  const [welcomeMe, setWelcomeMe] = useState(widgetSettings?.welcome_message_me ?? "");
  const [welcomeRu, setWelcomeRu] = useState(widgetSettings?.welcome_message_ru ?? "");

  function toggleLanguage(language: Language) {
    const isEnabled = supportedLanguages.includes(language);
    const next = isEnabled ? supportedLanguages.filter((l) => l !== language) : [...supportedLanguages, language];
    if (next.length === 0) return; // Always keep at least one language.
    onLanguagesChange(next);
  }

  const messagesDirty =
    title !== (widgetSettings?.title ?? "Adria Assistant") ||
    welcomeEn !== (widgetSettings?.welcome_message_en ?? "") ||
    welcomeMe !== (widgetSettings?.welcome_message_me ?? "") ||
    welcomeRu !== (widgetSettings?.welcome_message_ru ?? "");

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-sm font-semibold text-navy">Widget ID</p>
        <p className="mt-0.5 text-xs text-navy/55">
          Put this in your <code className="rounded bg-warm px-1 py-0.5">.env.local</code> as{" "}
          <code className="rounded bg-warm px-1 py-0.5">NEXT_PUBLIC_WIDGET_ID</code> so the public website knows
          which business&apos;s chat widget to show.
        </p>
        <p className="mt-2 select-all rounded-lg bg-warm px-3 py-2 font-mono text-xs text-navy">
          {business.public_widget_id}
        </p>
      </Card>

      <Card className="divide-y divide-navy/5 p-0">
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-navy">Mock AI enabled</p>
            <p className="mt-0.5 text-xs text-navy/55">Turns the chat widget on the public website on or off.</p>
          </div>
          <Toggle
            checked={widgetSettings?.mock_ai_enabled ?? true}
            onChange={(v) => onWidgetSettingsChange({ mockAiEnabled: v })}
            label="Mock AI enabled"
          />
        </div>

        <div className="p-5">
          <p className="text-sm font-semibold text-navy">Supported languages</p>
          <p className="mt-0.5 text-xs text-navy/55">Languages the assistant will try to detect and reply in.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_LANGUAGES.map((language) => {
              const enabled = supportedLanguages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  aria-pressed={enabled}
                  onClick={() => toggleLanguage(language)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    enabled ? "border-adriatic bg-adriatic-light text-adriatic-dark" : "border-navy/15 text-navy/50 hover:bg-sand-light",
                  )}
                >
                  {LANGUAGE_LABELS[language]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-navy">Human hand-off enabled</p>
            <p className="mt-0.5 text-xs text-navy/55">Lets guests ask to speak with a real person.</p>
          </div>
          <Toggle
            checked={widgetSettings?.human_handoff_enabled ?? true}
            onChange={(v) => onWidgetSettingsChange({ humanHandoffEnabled: v })}
            label="Human hand-off enabled"
          />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold text-navy">Widget title &amp; welcome messages</p>
        <p className="mt-0.5 text-xs text-navy/55">
          Shown in the chat header and as the first message. Leave a welcome message blank to use the built-in
          default for that language.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/60">Widget title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/60">Welcome message (English)</label>
            <textarea
              value={welcomeEn}
              onChange={(e) => setWelcomeEn(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/60">Welcome message (Crnogorski / Srpski)</label>
              <textarea
                value={welcomeMe}
                onChange={(e) => setWelcomeMe(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/60">Welcome message (Русский)</label>
              <textarea
                value={welcomeRu}
                onChange={(e) => setWelcomeRu(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-lg border border-navy/15 bg-warm px-3 py-2 text-sm text-navy focus:border-adriatic focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!messagesDirty}
          onClick={() =>
            onWidgetSettingsChange({
              title,
              welcomeMessageEn: welcomeEn,
              welcomeMessageMe: welcomeMe,
              welcomeMessageRu: welcomeRu,
            })
          }
          className="mt-4 rounded-full bg-adriatic px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save changes
        </button>
      </Card>

      <p className="text-xs text-navy/45">
        Widget title and welcome messages take effect immediately for new conversations. Primary colour and
        position are stored for a future phase — Phase 2 keeps the widget&apos;s approved visual design fixed.
      </p>
    </div>
  );
}
