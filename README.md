# Adria Stay Budva — Phase 2 (Supabase + authentication)

A web-based AI-receptionist demo for a fictional boutique apartment in Budva,
Montenegro. The chat assistant is still a **deterministic, keyword-based mock
engine** — no real AI API yet — but as of Phase 2, **Supabase is the source of
truth** for conversations, messages, leads and hand-offs, and the owner
dashboard sits behind real email/password authentication.

## What's in this demo

- **`/`** — the apartment's landing page (hero, overview, amenities, gallery,
  location, demo reviews) with a floating **"Ask Adria"** chat widget. The
  widget now talks to secure server routes (`/api/widget/*`) instead of
  writing to LocalStorage directly.
- **`/dashboard`** — the owner dashboard, now behind real sign-in. Shows the
  signed-in owner's business: leads, conversations (with a live "take over" /
  "close conversation" control), hand-off requests, editable knowledge,
  widget settings, a live widget preview, and demo controls — all backed by
  Supabase with Row Level Security.
- **`/login`, `/signup`, `/forgot-password`, `/reset-password`** — Supabase
  email/password auth pages.

The chat widget still detects English / Montenegrin-Serbian-Bosnian-Croatian
/ Russian, answers FAQs, and runs guided **booking enquiry** / **human
hand-off** flows exactly as in Phase 1 — see "What changed vs. Phase 1"
below for what moved under the hood.

## Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4
- Lucide React icons
- Supabase (Postgres, Auth, Row Level Security)
- Zod for request validation
- Vitest for unit tests

## Quick start (Phase 1 mode, no Supabase)

The landing page and its static content still render with zero
configuration:

```bash
npm install
npm run dev
```

The chat widget itself needs Supabase configured (see below) — without it,
in development you'll see a small "chat widget not configured" notice
instead of the button; in production the widget simply doesn't render
rather than showing anyone a technical error.

## Phase 2 setup (Supabase)

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project. Pick any name/
region/database password (save the password somewhere — you won't need it
for this app, but Supabase asks for it).

### 2. Find your project URL and keys

In the project dashboard: **Settings → API**.

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure `.env.local`

```bash
cp .env.example .env.local
```

Fill in the two `NEXT_PUBLIC_SUPABASE_*` values and `SUPABASE_SERVICE_ROLE_KEY`
now. Leave `NEXT_PUBLIC_WIDGET_ID` blank for now — you'll get it from the
dashboard after step 6.

**Never** put the service-role key behind `NEXT_PUBLIC_`, and never commit
`.env.local` (it's already git-ignored).

### 4. Run the migrations

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <your-project-ref>   # found in the project URL
supabase db push
```

This runs everything in `supabase/migrations/` in order: tables, indexes,
constraints, Row Level Security policies, and the owner-onboarding trigger.

No CLI available? Open **SQL Editor** in the Supabase dashboard and run each
file in `supabase/migrations/` in filename order (they're numbered).

### 5. Configure authentication URLs

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` for local dev (change to your
  production URL once deployed — see step 9).
- **Redirect URLs**: add `http://localhost:3000/auth/callback` (and your
  production equivalent later).

In **Authentication → Providers → Email**, email/password sign-up is enabled
by default. If you want to skip email confirmation while testing locally,
turn off "Confirm email" — the signup page handles either setting (it shows
a "check your email" screen if confirmation is required, or signs you
straight in if not).

### 6. Run seed / onboarding

There's no separate seed script to run — onboarding is automatic. Start the
app and sign up once at `/signup`:

```bash
npm run dev
```

Signing up fires a database trigger (`handle_new_user`, see
`supabase/migrations/20260201000300_onboarding.sql`) that atomically creates
your profile, your first business ("Adria Stay Budva"), the same FAQ
knowledge from `lib/chat/knowledge.ts`, and default widget settings — all in
one transaction, safely repeatable if it were ever triggered twice.

### 7. Get your widget id and finish `.env.local`

Sign in, go to the dashboard's **Settings** tab, and copy the **Widget ID**
shown there into `.env.local`:

```
NEXT_PUBLIC_WIDGET_ID=<paste it here>
```

Restart `npm run dev`. The "Ask Adria" button on `/` now talks to your
Supabase project.

### 8. Test locally

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Then manually: open `/`, chat with the widget (try a booking enquiry through
to submission, and try asking to speak to a human), then check `/dashboard`
— the conversation, messages and lead/hand-off should all appear.

### 9. Add environment variables to Vercel (or your host)

Project → **Settings → Environment Variables**, add all four:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_WIDGET_ID
```

Mark `SUPABASE_SERVICE_ROLE_KEY` as a **server-only secret** if your host
distinguishes them — it must never be reachable from client-side code
(`npm run build` verifies this automatically for the Next.js client bundle;
see `scripts/check-no-service-role-leak.mjs`, wired up as a `postbuild`
script).

### 10. Update Supabase redirect URLs for production

Back in **Authentication → URL Configuration**, once deployed:

- Update **Site URL** to your production domain.
- Add `https://<your-domain>/auth/callback` to **Redirect URLs** (keep the
  localhost one too if you still develop locally).

### Verifying Row Level Security manually

Automated tests can check the *policies* exist (`tests/rls-policies.test.ts`
reads the migration SQL and asserts, e.g., no table ever grants `using
(true)`), but the only way to be sure isolation actually holds is to
exercise it against a real project:

1. Sign up two owner accounts (e.g. `owner-a@example.com`,
   `owner-b@example.com`) — each gets their own business via the onboarding
   trigger.
2. As owner A, create a sample lead from the dashboard. Note its id from
   Supabase's **Table Editor**.
3. In the Supabase **SQL Editor**, run a query *as* owner B — easiest way is
   `select set_config('request.jwt.claims', json_build_object('sub',
   '<owner-b-user-id>', 'role', 'authenticated')::text, true); select * from
   leads where id = '<owner-a-lead-id>';` — this should return **zero rows**.
4. Repeat for `conversations`, `messages`, `businesses`, `knowledge_items`,
   `widget_settings`, `handoffs` — all should return zero rows for another
   owner's ids.
5. Confirm the `anon` role can't read anything either: same trick with
   `role: 'anon'` and no `sub` claim.

## What changed vs. Phase 1

- **LocalStorage is no longer the source of truth.** It only ever stores the
  visitor's own local identity now: an anonymous `visitor-id` and their
  current `conversation-id` (`lib/client/visitor.ts`), so a page reload can
  resume an open chat. There's a **dev-only "reset visitor session" button**
  next to the chat widget (visible only outside production) that clears
  both.
- **The mock chat engine (`lib/chat/mock-chat-service.ts`) is unchanged** —
  same intents, same knowledge, same booking/hand-off flows, same never-invent
  guardrails — but it now runs **server-side**, inside the `/api/widget/*`
  Route Handlers, so a visitor's browser can never fabricate what "the
  assistant" said. `ChatWidget.tsx` is now a thin client that POSTs to those
  routes (`lib/client/widget-api.ts`) and renders whatever comes back.
- **The dashboard is connected to Supabase** behind real auth, using the
  signed-in owner's own session (not the service-role key) so Row Level
  Security does the tenant-isolation work.
- **Apartment knowledge is now editable** in the dashboard (`knowledge_items`
  table) — but see the callout in the Apartment info tab: those edits don't
  yet feed back into what the *public* mock engine says (see "Known
  limitations").

## How the mock chat engine works

Business knowledge, translations, intent detection, the mock chat "brain"
and UI are kept in separate modules so a future real AI backend can be
dropped in without touching the widget components:

```
lib/chat/
  types.ts               shared ChatService/ConversationState/message types
  knowledge.ts            the single source of verified business facts + FAQ answers
  translations.ts          UI copy, suggested questions, flow prompts (en/me/ru)
  language-detection.ts    simple keyword-based language detection
  intent-detection.ts      simple keyword-based intent detection
  booking-flow.ts           step-by-step booking-enquiry state machine
  handoff-flow.ts            step-by-step human hand-off state machine
  mock-chat-service.ts       implements ChatService — runs server-side now
  widget-events.ts            tiny window-event bus so page CTAs can open the widget

lib/supabase/
  env.ts                  reads/validates the three Supabase env vars, fails safely
  client.ts                browser client (auth forms)
  server.ts                 cookie-authenticated client (Server Components, Server Actions)
  admin.ts                   service-role client — server-only, used only by /api/widget/*
  database.types.ts           hand-written row types mirroring the SQL schema

lib/server/
  widget-service.ts        business resolution + conversation/message/lead/hand-off persistence
  rate-limit.ts             in-memory rate limiter for the public widget routes
  api-response.ts            small consistent JSON error/logging helpers

lib/validation/
  widget.ts                Zod schemas for every /api/widget/* request
  auth.ts                    Zod schemas for the auth forms

lib/client/
  visitor.ts               the only LocalStorage left — visitor id + current conversation id
  widget-api.ts              fetch wrappers the widget calls

lib/utils/
  date.ts / validation.ts / id.ts / cn.ts

app/api/widget/
  session/route.ts         starts or resumes a conversation
  message/route.ts          runs the engine, persists both sides of the turn
  lead/route.ts               standalone, independently secured lead-creation endpoint
  handoff/route.ts             standalone, independently secured hand-off endpoint

app/dashboard/
  layout.tsx               the real auth guard (redirects signed-out visitors)
  page.tsx                   Server Component — fetches the owner's data
  actions.ts                  Server Actions for every dashboard mutation

proxy.ts                  optimistic session refresh + redirect (fast path only —
                            see the comment in app/dashboard/layout.tsx for why
                            that layout, not this file, is the real guard)
```

Every chat component (`components/chat/*`) still only depends on the
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

### Public widget security, in one place

- The browser only ever sends a `public_widget_id` (a non-secret UUID) —
  never a `business_id`, and nothing is ever accepted as "proof" of which
  business/conversation a request belongs to. Every route re-resolves the
  business from `public_widget_id` and verifies a `conversationId` actually
  belongs to that business *and* that visitor (`lib/server/widget-service.ts`).
- All four `/api/widget/*` routes validate input with Zod, rate-limit by
  `widgetId:visitorId:ip`, and use the service-role client — which is why
  there are **no Supabase policies granting the `anon` role anything at
  all** (see `supabase/migrations/20260201000200_row_level_security.sql`).
- `lib/supabase/admin.ts` (the only place the service-role key is read) is
  guarded by the `server-only` package: importing it from a Client Component
  is a **build error**, not just a lint warning — verified for real in this
  repo's history by deliberately importing it into a client component and
  confirming `next build` refused to compile.
- `npm run build` also runs `scripts/check-no-service-role-leak.mjs`
  afterwards, scanning the actual client JS output for the key.

## Data & privacy

- LocalStorage only ever holds a visitor id and a conversation id (see
  above) — never leads, messages, or settings.
- Before a booking enquiry is submitted, the assistant shows the consent
  text and states plainly that it's an enquiry, not a confirmed reservation.
  `leads.consent_at` records exactly when that consent was given.
- No payment, card, passport, medical, legal or financial information is
  ever collected or stored, in the widget or the dashboard.
- Resetting demo data (`dashboard → Reset demo data`) permanently deletes
  that business's conversations, messages, leads and hand-offs in Supabase —
  knowledge and settings are left alone.

## Images

The landing page uses remote placeholder photos (`picsum.photos`). If they
fail to load — no internet access, or the third-party service is down — the
page shows a graceful placeholder instead of a broken image icon
(`components/ui/ImageWithFallback.tsx`).

## Testing

```bash
npm run test
```

Unit tests (`tests/*.test.ts`, Vitest) cover:

- language & intent detection, date/guest validation (unchanged from Phase 1)
- the mock chat service's unknown-question fallback and its refusal to
  confirm availability/price directly
- the full booking-enquiry and hand-off flows, including cancellation
- **Zod validation**: message length limit, lead validation (consent
  required, check-out-after-check-in, 1–4 guest limit, malformed reference)
- **`resolveActiveBusiness`**: an unknown or inactive `public_widget_id`
  behaves identically (never distinguishable to a caller) — covers "invalid
  public_widget_id" and "inactive business"
- **`loadOwnedConversation`** (tenant isolation): a conversation is only
  ever returned when its id, business and visitor all match — a forged or
  guessed conversation id from a different business or visitor gets `null`
- **persistence shape** for assistant replies, leads and hand-offs (records
  are inserted with the fields a real read-back would expect)
- the in-memory rate limiter (allows up to the limit, blocks over it, tracks
  keys independently, resets after the window)
- missing-environment-variable behaviour (`isSupabaseConfigured`,
  `isWidgetConfigured`, `createSupabaseAdminClient` all fail safely to
  `false`/`null` rather than throwing)
- a static contract over the RLS migration SQL (RLS enabled on every table,
  no `using (true)`, no `anon`/`public` grants, every policy scoped through
  `auth.uid()`)

What these tests **can't** cover without a live Postgres project — actual
end-to-end RLS enforcement, protected-dashboard redirects through real
cookies, and the full signup → onboarding-trigger → dashboard flow — is
covered by the manual steps in "Verifying Row Level Security manually"
above and step 8 of the setup guide.

## Known limitations

- **Apartment info edits don't feed the live bot yet.** The dashboard can
  edit `knowledge_items` in Supabase, but the public mock engine still
  answers from the static `lib/chat/knowledge.ts` file (per the brief:
  "Keep the mock chat engine responsible for generating Phase 2 replies").
  Reconciling the two — having the engine read from the database — is a
  reasonable next step but was kept out of scope here to avoid changing the
  approved chat behaviour mid-phase.
- **Rate limiting is in-memory**, so on a multi-instance/serverless
  deployment the effective limit is "N requests per window, per instance,"
  not a hard global cap. Fine for absorbing one misbehaving tab or script;
  a real production deployment would want Redis/Upstash instead.
- **Widget title/colour/position**: title and welcome messages are wired up
  end-to-end; `primary_color` and `position` are stored and editable but
  don't yet re-skin the live widget, to keep this phase's approved visual
  design untouched.
- **`conversations.flow_state`** is a column beyond the brief's literal
  table spec — added because the mock engine's in-progress booking/hand-off
  step and draft have to be persisted *somewhere* once the engine runs
  server-side (a stateless HTTP request can't otherwise resume a multi-step
  flow). It's a `jsonb` mirror of `ConversationState` from
  `lib/chat/types.ts`; see `supabase/migrations/20260201000100_conversation_tables.sql`.
- **`NEXT_PUBLIC_WIDGET_ID`** is an addition beyond the three named
  environment variables — necessary because this is a single-tenant demo
  and the landing page needs to know which business's widget to render (see
  `.env.example` and `lib/supabase/env.ts` for the full reasoning).
- Lead reference numbers are generated from a `count(*)` over existing leads
  — fine at this scale, but two enquiries submitted in the same instant
  could in principle race to the same sequence number. `leads.reference`
  has a unique constraint, so the very rare collision fails loudly (500)
  rather than silently duplicating a reference.

## Project status

This is Phase 2 of 5 — see `ROADMAP.md` for what a real AI API, an
embeddable widget and messaging-channel integrations add on top of this
without needing a rewrite.
