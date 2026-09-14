import { clearLeads, getLeads, saveLead } from "@/lib/storage/leads";
import { clearConversations } from "@/lib/storage/conversations";
import { resetSettings } from "@/lib/storage/settings";
import { generateLeadReference } from "@/lib/utils/id";
import { toISODate } from "@/lib/utils/date";
import type { Lead } from "@/lib/storage/types";

const SAMPLE_NAMES = ["Elena Petrova", "Marko Vukovic", "James Whitfield", "Ana Kovac", "Igor Sokolov"];
const SAMPLE_NOTES = [
  "Celebrating an anniversary, a quiet room would be great.",
  "Travelling with a small dog, just wanted to confirm in advance.",
  "Arriving late in the evening, is that OK?",
  "",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Wipes every piece of demo data this app stores in LocalStorage. */
export function resetDemoData(): void {
  clearLeads();
  clearConversations();
  resetSettings();
}

/** Creates a realistic-looking sample lead so the dashboard isn't empty on first visit. */
export function createSampleLead(): Lead {
  const reference = generateLeadReference(getLeads().length + 1);
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(checkIn.getDate() + 7 + Math.floor(Math.random() * 20));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2 + Math.floor(Math.random() * 5));

  const languages: Lead["language"][] = ["en", "me", "ru"];
  const contacts = ["+382 67 123 456", "+7 999 123 45 67", "guest@example.com", "+44 7700 900123"];

  const lead: Lead = {
    id: reference,
    source: "sample",
    name: pick(SAMPLE_NAMES),
    contact: pick(contacts),
    checkIn: toISODate(checkIn),
    checkOut: toISODate(checkOut),
    guests: 1 + Math.floor(Math.random() * 4),
    note: pick(SAMPLE_NOTES),
    language: pick(languages),
    status: "new",
    createdAt: Date.now(),
  };

  return saveLead(lead);
}
