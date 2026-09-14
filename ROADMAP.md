# Roadmap

## Phase 1 — Demo product ✅ complete

- Deterministic, keyword-based mock chat service (`lib/chat/mock-chat-service.ts`)
- Static business knowledge (`lib/chat/knowledge.ts`)
- English / Montenegrin-Serbian-Bosnian-Croatian / Russian detection
- Guided booking-enquiry and human hand-off flows
- LocalStorage-backed leads, conversations and settings
- Demo owner dashboard, no authentication

## Phase 2 — Supabase & owner authentication ✅ complete

*(marked complete after lint, typecheck, unit tests and a production build
all passed — see README.md → "Testing" and "Phase 2 setup" for how to
verify this yourself against a real Supabase project.)*

- Supabase Postgres schema (`supabase/migrations/`): `profiles`,
  `businesses`, `knowledge_items`, `conversations`, `messages`, `leads`,
  `handoffs`, `widget_settings` — with check constraints, indexes, and Row
  Level Security on every table.
- Idempotent owner onboarding via a database trigger on `auth.users`:
  profile + first business + seeded knowledge + default widget settings,
  atomically, safe against duplicate firing.
- Real email/password authentication: `/login`, `/signup`,
  `/forgot-password`, `/reset-password`, `/auth/callback`, sign-out —
  protected by both an optimistic Proxy redirect and a real server-side
  session check in `app/dashboard/layout.tsx`.
- The public chat widget now persists through secure, rate-limited,
  Zod-validated server routes (`/api/widget/session|message|lead|handoff`)
  that resolve tenancy from a public, non-secret `public_widget_id` —
  never a client-supplied `business_id` — and write via the service-role
  key, which is never reachable from a client bundle (enforced by the
  `server-only` guard and a `postbuild` script).
- The mock chat engine itself (intents, knowledge, booking/hand-off flows,
  never-invent guardrails) is **unchanged** — it now executes inside those
  server routes instead of the browser, so a visitor can't fabricate what
  "the assistant" said.
- Owner dashboard connected end-to-end to Supabase, scoped by Row Level
  Security through the owner's own session (not the service-role key):
  leads, conversations (with human take-over/close controls), hand-offs,
  editable knowledge, editable widget title/welcome messages/languages,
  and Supabase-backed demo controls.
- LocalStorage demoted to visitor-only bookkeeping (an anonymous visitor id
  + current conversation id), with a dev-only "reset visitor session"
  control.

See README.md → "Known limitations" for what was deliberately deferred
(knowledge-edit reconciliation with the live engine, in-memory rate
limiting, widget re-theming) rather than rushed into this phase.

## Phase 3 — Real AI API

- Implement `lib/chat/openai-chat-service.ts` (or an equivalent
  Anthropic/OpenAI-backed service) against the existing `ChatService`
  interface from `lib/chat/types.ts` — the chat widget components should
  not need to change.
- Keep the verified-knowledge guardrails: the assistant still answers from
  structured business data and still never invents availability, pricing or
  policy, even when a real model is generating the phrasing.
- Feed the model prepared knowledge as context/tools rather than letting it
  answer freely, and keep the deterministic booking/hand-off flows as a
  structured fallback for the steps that must not be improvised.
- Reconcile `knowledge_items` (now editable in the dashboard, per Phase 2)
  with what the assistant actually answers from, so an owner's edits take
  effect live.

## Phase 4 — Embeddable external widget

- Package the chat widget as a standalone embeddable script/iframe so it can
  be dropped into a host's existing website (Wix, Squarespace, custom HTML)
  with a single `<script>` tag, similar to Intercom/Crisp-style widgets.
- Replace the Phase 2 build-time `NEXT_PUBLIC_WIDGET_ID` with per-embed
  configuration resolved at runtime.
- Add a per-apartment configuration (brand colours, language defaults)
  resolved server-side, finally putting `widget_settings.primary_color`
  and `position` to use.

## Phase 5 — WhatsApp & Instagram integrations

- Route the same `ChatService` behind WhatsApp Business API and Instagram
  DM webhooks, so guests can start the same conversation (and the same
  booking/hand-off flows) from the channels they already use.
- `conversations.channel` and `leads.source` already model this (`website`
  / `instagram` / `whatsapp`) — Phase 5 is mainly the webhook plumbing.
- Unify leads and conversations from every channel into the same dashboard.
