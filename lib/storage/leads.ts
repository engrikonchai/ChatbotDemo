import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readJSON, writeJSON } from "@/lib/storage/storage";
import type { Lead, LeadStatus, NewLeadInput } from "@/lib/storage/types";

export function getLeads(): Lead[] {
  return readJSON<Lead[]>(STORAGE_KEYS.leads, []);
}

function saveLeads(leads: Lead[]): void {
  writeJSON(STORAGE_KEYS.leads, leads);
}

/**
 * Saves a fully-formed lead (id/reference already decided by the
 * caller — usually the chat service, which needs the reference to
 * mention it in the confirmation message). If a lead with the same id
 * already exists it is replaced.
 */
export function saveLead(lead: Lead): Lead {
  const leads = getLeads();
  const index = leads.findIndex((existing) => existing.id === lead.id);
  if (index >= 0) {
    leads[index] = lead;
  } else {
    leads.push(lead);
  }
  saveLeads(leads);
  return lead;
}

/** Convenience for demo/manual lead creation where no id/reference exists yet. */
export function addLead(input: NewLeadInput, reference: string): Lead {
  const lead: Lead = {
    ...input,
    id: reference,
    status: "new",
    createdAt: input.createdAt ?? Date.now(),
  };
  return saveLead(lead);
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead[] {
  const leads = getLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead));
  saveLeads(leads);
  return leads;
}

export function deleteLead(id: string): Lead[] {
  const leads = getLeads().filter((lead) => lead.id !== id);
  saveLeads(leads);
  return leads;
}

export function clearLeads(): void {
  saveLeads([]);
}
