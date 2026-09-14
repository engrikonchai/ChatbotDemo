# Roadmap

Phase 1 (this repository) is a fully self-contained demo: no AI API, no
database, no authentication. It exists to prove the product concept and the
interface. The phases below describe how it grows up — each one should be
possible without rebuilding the phases before it.

## Phase 1 — Demo product (current)

- Deterministic, keyword-based mock chat service (`lib/chat/mock-chat-service.ts`)
- Static business knowledge (`lib/chat/knowledge.ts`)
- English / Montenegrin-Serbian-Bosnian-Croatian / Russian detection
- Guided booking-enquiry and human hand-off flows
- LocalStorage-backed leads, conversations and settings
- Demo owner dashboard, no authentication

## Phase 2 — Supabase & owner authentication

- Replace the LocalStorage layer (`lib/storage/*`) with Supabase tables for
  leads, conversations and settings, behind the same function signatures
  where practical, so components don't need to change.
- Add owner authentication (Supabase Auth) in front of `/dashboard`.
- Add row-level security so each apartment owner only sees their own data.
- Make the "Apartment information" panel editable, writing back to the
  business-knowledge table instead of the static `knowledge.ts` file.

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

## Phase 4 — Embeddable external widget

- Package the chat widget as a standalone embeddable script/iframe so it can
  be dropped into a host's existing website (Wix, Squarespace, custom HTML)
  with a single `<script>` tag, similar to Intercom/Crisp-style widgets.
- Add a per-apartment configuration (widget key, brand colours, language
  defaults) resolved server-side.

## Phase 5 — WhatsApp & Instagram integrations

- Route the same `ChatService` behind WhatsApp Business API and Instagram
  DM webhooks, so guests can start the same conversation (and the same
  booking/hand-off flows) from the channels they already use.
- Unify leads and conversations from every channel into the same dashboard.
