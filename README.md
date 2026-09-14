# Adria Stay Budva — Phase 1 demo

A web-based AI-receptionist demo for a fictional boutique apartment in Budva,
Montenegro. Phase 1 is fully self-contained: **no AI API, no Supabase, no
paid service, and no authentication.** The chat assistant is a deterministic,
keyword-based mock engine built from prepared, verified business knowledge.

## What's in this demo

- **`/`** — the apartment's landing page (hero, overview, amenities, gallery,
  location, demo reviews) with a floating **"Ask Adria"** chat widget.
- **`/dashboard`** — a demo owner dashboard (no login yet) showing leads,
  stored conversations, the assistant's knowledge, a live widget preview and
  settings, all read from the browser's LocalStorage.

The chat widget detects English / Montenegrin-Serbian-Bosnian-Croatian /
Russian from what the visitor types, answers FAQs from a fixed knowledge
file, and can run a guided **booking enquiry** or **human hand-off** flow
that ends with a saved lead and a reference number. It never invents
availability, pricing, or policies that aren't in the knowledge file.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4
- Lucide React icons
- Vitest for unit tests
- LocalStorage for all demo data — no database

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No environment variables are required —
see `.env.example`.

### All available commands

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run start        # run the production build (after `npm run build`)
npm run lint         # ESLint
npm run typecheck    # TypeScript, no emit
npm run test         # run the unit tests once
npm run test:watch   # run the unit tests in watch mode
```

A one-off way to check everything at once, exactly like CI would:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

## How the mock chat engine works

Business knowledge, translations, intent detection, the mock chat "brain",
LocalStorage and UI are all kept in separate modules so a future real AI
backend can be dropped in without touching the widget components:

```
lib/chat/
  types.ts               shared ChatService/ConversationState/message types
  knowledge.ts            the single source of verified business facts + FAQ answers
  translations.ts          UI copy, suggested questions, flow prompts (en/me/ru)
  language-detection.ts    simple keyword-based language detection
  intent-detection.ts      simple keyword-based intent detection
  booking-flow.ts           step-by-step booking-enquiry state machine
  handoff-flow.ts            step-by-step human hand-off state machine
  mock-chat-service.ts       implements ChatService — the only file the widget calls
  widget-events.ts            tiny window-event bus so page CTAs can open the widget

lib/storage/
  keys.ts / storage.ts       versioned, SSR-safe LocalStorage helpers
  leads.ts / conversations.ts / settings.ts / demo.ts
  types.ts                    Lead / StoredConversation / AppSettings shapes

lib/utils/
  date.ts / validation.ts / id.ts / cn.ts
```

Every chat component (`components/chat/*`) only depends on the
`ChatService` interface in `lib/chat/types.ts`. A future
`lib/chat/openai-chat-service.ts` implementing the same interface can
replace `mockChatService` without any UI changes — see `ROADMAP.md`.

### Guardrails

The mock service answers only from `lib/chat/knowledge.ts`. It will not:

- confirm availability (always routes to a booking enquiry instead)
- state a nightly price or a transfer price (always says the host confirms it)
- confirm a reservation (an enquiry is explicitly labelled "not a confirmed
  reservation" before and after submission)
- invent an answer to a question it doesn't recognise (it offers to send the
  question to the host instead)

## Data & privacy

All demo data (conversations, leads, settings) is stored client-side under
versioned LocalStorage keys (`adria-stay-budva:v1:*`) and never leaves the
browser. No payment details or passport/ID information are ever collected or
stored. Use the dashboard's **"Reset demo data"** button to clear everything.

## Images

The landing page uses remote placeholder photos (`picsum.photos`). If they
fail to load — no internet access, or the third-party service is down — the
page shows a graceful placeholder instead of a broken image icon
(`components/ui/ImageWithFallback.tsx`).

## Testing

Unit tests (`tests/*.test.ts`, run with Vitest) cover:

- language detection (en / me / ru, including inconclusive input)
- intent detection for every recognised category
- date parsing and check-in/check-out/guest-count validation
- the mock chat service's unknown-question fallback
- the mock chat service's refusal to confirm availability/price directly
- the full booking-enquiry and hand-off flows, including cancellation
- lead storage (save/update/delete, and recovering from corrupted JSON)

```bash
npm run test
```

## Project status

This is Phase 1 of 5 — see `ROADMAP.md` for what Supabase-backed auth, a
real AI API, an embeddable widget and messaging-channel integrations will
add on top of this without needing a rewrite.
