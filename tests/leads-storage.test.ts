import { beforeEach, describe, expect, it } from "vitest";
import { addLead, deleteLead, getLeads, saveLead, updateLeadStatus, clearLeads } from "@/lib/storage/leads";
import { generateLeadReference } from "@/lib/utils/id";
import type { Lead } from "@/lib/storage/types";

beforeEach(() => {
  window.localStorage.clear();
});

function baseLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: generateLeadReference(1),
    source: "booking",
    name: "Test Guest",
    contact: "guest@example.com",
    checkIn: "2026-06-10",
    checkOut: "2026-06-14",
    guests: 2,
    language: "en",
    status: "new",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("leads storage", () => {
  it("returns an empty array when nothing has been stored yet", () => {
    expect(getLeads()).toEqual([]);
  });

  it("round-trips a saved lead through LocalStorage as valid JSON", () => {
    const lead = baseLead();
    saveLead(lead);

    const stored = getLeads();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(lead);

    const raw = window.localStorage.getItem("adria-stay-budva:v1:leads");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual([lead]);
  });

  it("addLead assigns id, status and createdAt", () => {
    const reference = generateLeadReference(1);
    const lead = addLead(
      {
        source: "handoff",
        name: "Handoff Guest",
        contact: "+382 67 000 000",
        language: "me",
        question: "Is there a lift?",
      },
      reference,
    );

    expect(lead.id).toBe(reference);
    expect(lead.status).toBe("new");
    expect(typeof lead.createdAt).toBe("number");
    expect(getLeads()).toHaveLength(1);
  });

  it("saveLead replaces an existing lead with the same id instead of duplicating it", () => {
    const lead = baseLead();
    saveLead(lead);
    saveLead({ ...lead, status: "confirmed" });

    const stored = getLeads();
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe("confirmed");
  });

  it("updateLeadStatus updates only the targeted lead", () => {
    const leadA = baseLead({ id: "ASB-2026-0001" });
    const leadB = baseLead({ id: "ASB-2026-0002" });
    saveLead(leadA);
    saveLead(leadB);

    updateLeadStatus("ASB-2026-0001", "contacted");

    const stored = getLeads();
    expect(stored.find((l) => l.id === "ASB-2026-0001")?.status).toBe("contacted");
    expect(stored.find((l) => l.id === "ASB-2026-0002")?.status).toBe("new");
  });

  it("deleteLead removes only the targeted lead", () => {
    const leadA = baseLead({ id: "ASB-2026-0001" });
    const leadB = baseLead({ id: "ASB-2026-0002" });
    saveLead(leadA);
    saveLead(leadB);

    deleteLead("ASB-2026-0001");

    const stored = getLeads();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("ASB-2026-0002");
  });

  it("clearLeads empties the collection", () => {
    saveLead(baseLead());
    clearLeads();
    expect(getLeads()).toEqual([]);
  });

  it("gracefully falls back to an empty array when stored JSON is corrupted", () => {
    window.localStorage.setItem("adria-stay-budva:v1:leads", "{ not valid json");
    expect(getLeads()).toEqual([]);
  });
});
