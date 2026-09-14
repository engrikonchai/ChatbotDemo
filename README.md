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

Fill in the two `NEXT_PUBLIC_SUPABASE_*` values and `SUPABASE_SERVICE_ROLE_KEY`.
Leave `CHAT_PROVIDER=mock` as-is — that's the only chat backend implemented
so far (see "Mock mode" below). Nothing else is needed: the public landing
page finds its business itself, server-side, from the well-known slug
`adria-stay-budva` — there's no widget id to copy-paste.

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

### 7. Check your setup on the dashboard's Settings tab

Sign in and open the dashboard's **Settings** tab. It shows your business's
**slug** (must read exactly `adria-stay-budva` — highlighted red if not) and
its **Widget ID** (shown for reference only, never needed in `.env.local`).
If the slug is wrong, inactive, or mock AI got toggled off, click
**Repair widget setup** — this re-runs the same idempotent onboarding logic
against your own business only (see "The widget stopped resolving a
business" below for why this can happen and the authoritative migration fix).

The "Ask Adria" button on `/` already talks to your Supabase project — no
restart or extra config needed.

### 8. Test locally

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Then manually, **while signed out of everything**: open `/`, chat with the
widget (try a booking enquiry through to submission, and try asking to
speak to a human) — none of it requires signing in. Then sign in and check
`/dashboard` — the conversation, messages and lead/hand-off should all
appear.

### 9. Add environment variables to Vercel (or your host)

Project → **Settings → Environment Variables**, add all four:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CHAT_PROVIDER=mock
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

### Mock mode

`CHAT_PROVIDER=mock` is read server-side only, in `lib/server/chat-provider.ts`,
by the `/api/widget/*` routes — the browser never chooses or even sees which
provider is active. It defaults to `"mock"` even if the variable is unset,
and never looks at `OPENAI_API_KEY` in any way: the assistant keeps working
in mock mode with no AI API key at all, in every environment (local, Vercel
preview, Vercel production). Any other value throws a clear server-side
error rather than silently falling back to mock (see
`tests/chat-provider.test.ts`). A future `"openai"` provider is Phase 3 —
see ROADMAP.md.

### If the public chat widget stops working

This happened once already (see git history) — the demo business's slug
wasn't the bare `adria-stay-budva` the landing page looks up, so
`resolveActiveBusinessBySlug` found nothing and the widget correctly, safely
did nothing rather than fake a session. If it happens again:

1. Check the dashboard's **Settings** tab (step 7 above) — the slug is
   shown there, highlighted if wrong, with a one-click **Repair widget
   setup** button.
2. Or run the authoritative fix directly:
   `supabase/migrations/20260202000000_repair_onboarding.sql` — safe to run
   any number of times, fixes the slug for the oldest existing business,
   re-activates it, re-enables mock AI, and backfills any `auth.users` row
   that's missing a profile/business.
3. In development, an unresolved business shows a small dev-only notice
   next to where the chat button would be (never shown in production —
   see `components/chat/ChatWidget.tsx`).

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
  widget-service.ts        business resolution (by public_widget_id and by slug) + conversation/message/lead/hand-off persistence
  chat-provider.ts           server-side-only CHAT_PROVIDER selection — never checks OPENAI_API_KEY
  rate-limit.ts             in-memory rate limiter for the public widget routes
  api-response.ts            small consistent JSON error/logging helpers

lib/validation/
  widget.ts                Zod schemas for every /api/widget/* request
  auth.ts                    Zod schemas for the auth forms

lib/shared/
  messages.ts               copy shared between server routes and the client widget (no drift between the two)

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

- `app/page.tsx` resolves the demo business's `public_widget_id` itself,
  server-side, from the well-known slug `adria-stay-budva` (using the
  service-role client, since there's no owner session on the public
  landing page) and passes it into `<ChatWidget publicWidgetId={...} />`
  as a prop — not a build-time env var, and not dependent on which owner
  is signed in.
- From there, the browser only ever sends that `public_widget_id` (a
  non-secret UUID) — never a `business_id`, and nothing is ever accepted
  as "proof" of which business/conversation a request belongs to. Every
  route re-resolves the business from `public_widget_id` and verifies a
  `conversationId` actually belongs to that business *and* that visitor
  (`lib/server/widget-service.ts`).
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
  are inserted with the fields a real read-back would expect), including
  that a lead is never reported as created if the database insert actually
  failed (and the already-saved success message gets corrected, not left
  claiming a reference number that doesn't exist)
- **full route-level tests** for all four `/api/widget/*` handlers against a
  faked Supabase client (`tests/widget-routes.test.ts`): a session can be
  created for an unauthenticated visitor, an invalid or inactive widget id
  is rejected identically, a message is saved and answered, and a full
  8-turn booking flow ends with exactly one row in `leads`
- **`getChatService`** (`tests/chat-provider.test.ts`): defaults to mock,
  works with or without `OPENAI_API_KEY` set, and fails clearly (never
  silently) for an unsupported `CHAT_PROVIDER`
- the in-memory rate limiter (allows up to the limit, blocks over it, tracks
  keys independently, resets after the window)
- missing-environment-variable behaviour (`isSupabaseConfigured`,
  `createSupabaseAdminClient` fail safely to `false`/`null` rather than
  throwing)
- a static contract over the RLS migration SQL (RLS enabled on every table,
  no `using (true)`, no `anon`/`public` grants, every policy scoped through
  `auth.uid()`) and over `proxy.ts` (its matcher only ever targets
  `/dashboard`, so the homepage and `/api/widget/*` are never redirected to
  `/login`)
- a regression guard confirming the Phase-1 LocalStorage-as-database modules
  stay deleted and nothing re-imports them as a fallback

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
- **`CHAT_PROVIDER`** is an addition beyond the three named Supabase
  environment variables — server-side-only provider selection so mock mode
  never depends on `OPENAI_API_KEY` and the browser never picks the
  backend (see `.env.example` and `lib/server/chat-provider.ts`).
- **The demo is single-tenant by design.** The public landing page always
  resolves the one business with slug `adria-stay-budva`
  (`lib/server/widget-service.ts` `resolveActiveBusinessBySlug`) — there's
  no concept yet of the landing page serving a different business per
  request. Phase 4 (embeddable widget) is where that becomes per-embed
  configuration instead of a fixed slug.
- Lead reference numbers are generated from a `count(*)` over existing leads
  — fine at this scale, but two enquiries submitted in the same instant
  could in principle race to the same sequence number. `leads.reference`
  has a unique constraint, so the very rare collision fails loudly (500)
  rather than silently duplicating a reference.

## Project status

This is Phase 2 of 5 — see `ROADMAP.md` for what a real AI API, an
embeddable widget and messaging-channel integrations add on top of this
without needing a rewrite.
