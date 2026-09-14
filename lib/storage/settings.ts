import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readJSON, writeJSON } from "@/lib/storage/storage";
import type { AppSettings } from "@/lib/storage/types";

export const DEFAULT_SETTINGS: AppSettings = {
  mockAiEnabled: true,
  supportedLanguages: ["en", "me", "ru"],
  humanHandoffEnabled: true,
  availabilityConfirmationRequired: true,
};

export function getSettings(): AppSettings {
  return readJSON<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...partial };
  writeJSON(STORAGE_KEYS.settings, next);
  return next;
}

export function resetSettings(): AppSettings {
  writeJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
