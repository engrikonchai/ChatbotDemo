"use client";

import { Card } from "@/components/ui/Card";
import { LANGUAGE_LABELS } from "@/lib/chat/translations";
import type { AppSettings } from "@/lib/storage/types";
import type { Language } from "@/lib/chat/types";
import { cn } from "@/lib/utils/cn";

const ALL_LANGUAGES: Language[] = ["en", "me", "ru"];

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (partial: Partial<AppSettings>) => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-adriatic" : "bg-navy/15",
      )}
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

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  function toggleLanguage(language: Language) {
    const isEnabled = settings.supportedLanguages.includes(language);
    const next = isEnabled
      ? settings.supportedLanguages.filter((l) => l !== language)
      : [...settings.supportedLanguages, language];
    if (next.length === 0) return; // Always keep at least one language.
    onChange({ supportedLanguages: next });
  }

  return (
    <div className="space-y-5">
      <Card className="divide-y divide-navy/5 p-0">
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-navy">Mock AI enabled</p>
            <p className="mt-0.5 text-xs text-navy/55">
              Turns the deterministic mock assistant on the website on or off.
            </p>
          </div>
          <Toggle
            checked={settings.mockAiEnabled}
            onChange={(v) => onChange({ mockAiEnabled: v })}
            label="Mock AI enabled"
          />
        </div>

        <div className="p-5">
          <p className="text-sm font-semibold text-navy">Supported languages</p>
          <p className="mt-0.5 text-xs text-navy/55">Languages the assistant will try to detect and reply in.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_LANGUAGES.map((language) => {
              const enabled = settings.supportedLanguages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  aria-pressed={enabled}
                  onClick={() => toggleLanguage(language)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    enabled
                      ? "border-adriatic bg-adriatic-light text-adriatic-dark"
                      : "border-navy/15 text-navy/50 hover:bg-sand-light",
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
            <p className="mt-0.5 text-xs text-navy/55">
              Lets guests ask to speak with a real person and captures a hand-off lead.
            </p>
          </div>
          <Toggle
            checked={settings.humanHandoffEnabled}
            onChange={(v) => onChange({ humanHandoffEnabled: v })}
            label="Human hand-off enabled"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-navy">Availability confirmation required</p>
            <p className="mt-0.5 text-xs text-navy/55">
              The assistant never confirms availability itself — always routed to the host.
            </p>
          </div>
          <Toggle
            checked={settings.availabilityConfirmationRequired}
            onChange={(v) => onChange({ availabilityConfirmationRequired: v })}
            label="Availability confirmation required"
          />
        </div>
      </Card>

      <p className="text-xs text-navy/45">
        Only “Mock AI enabled” changes live behaviour in Phase 1 — the others are stored and shown here
        ready to be wired into the assistant in a later phase.
      </p>
    </div>
  );
}
