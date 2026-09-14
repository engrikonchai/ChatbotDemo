import type { HandoffDraft, HandoffStep, Language } from "@/lib/chat/types";
import { HANDOFF_FLOW_TEXT } from "@/lib/chat/translations";
import { validateContact, validateName } from "@/lib/utils/validation";

export interface HandoffStepOutcome {
  reply: string;
  nextStep: HandoffStep;
  draft: HandoffDraft;
  /** True once contact + question are both collected — caller should create the lead. */
  submitted?: boolean;
}

/**
 * Advances the human hand-off flow by one step. Pure and side-effect
 * free, mirroring `processBookingStep`.
 */
export function processHandoffStep(
  step: HandoffStep,
  draft: HandoffDraft,
  message: string,
  language: Language,
): HandoffStepOutcome {
  const t = HANDOFF_FLOW_TEXT[language];

  switch (step) {
    case "contact": {
      const validation = validateContact(message);
      if (!validation.valid) {
        return { reply: t.errorContact, nextStep: "contact", draft };
      }
      return {
        reply: t.askQuestion,
        nextStep: "question",
        draft: { ...draft, contact: message.trim() },
      };
    }

    case "question": {
      // A question re-uses the "name" validator: just needs non-empty text.
      const validation = validateName(message);
      if (!validation.valid) {
        return { reply: t.errorQuestion, nextStep: "question", draft };
      }
      return {
        reply: "",
        nextStep: "done",
        draft: { ...draft, question: message.trim() },
        submitted: true,
      };
    }

    case "done":
    default:
      return { reply: "", nextStep: "done", draft };
  }
}
