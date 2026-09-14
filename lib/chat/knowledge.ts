import type { Intent, Language } from "@/lib/chat/types";

/**
 * The Supabase `businesses.slug` for this single-tenant demo. The
 * public landing page resolves its `public_widget_id` server-side from
 * this slug (see `lib/server/widget-service.ts` and `app/page.tsx`) —
 * it never depends on which owner is signed in, and never requires the
 * visitor to be signed in.
 */
export const DEMO_BUSINESS_SLUG = "adria-stay-budva";

/**
 * The single source of truth for verified business facts. The mock
 * chat service only ever answers from here — it never invents prices,
 * availability, or policies that aren't listed below. The dashboard's
 * "Apartment information" panel renders this same object.
 */
export const APARTMENT_INFO = {
  name: "Adria Stay Budva",
  location: "Budva, Montenegro",
  propertyType: "Modern one-bedroom apartment",
  maxGuests: 4,
  languages: ["Montenegrin", "English", "Russian"] as const,
  checkInTime: "14:00",
  checkOutTime: "10:00",
  parking: "One free private parking space",
  wifi: "Free Wi-Fi throughout the apartment",
  pets: "Small pets allowed with prior approval",
  smoking: "Not allowed",
  airportTransfer: "Available on request; price requires confirmation",
  beachDistance: "Approximately 8 minutes on foot",
  oldTownDistance: "Approximately 15 minutes on foot",
  payment: "Confirmed directly with the host",
  availability: "Must always be confirmed by the host",
};

type FaqIntent = Exclude<Intent, "greeting" | "unknown" | "human" | "availability">;

/** Prepared, verified answers for factual questions, per language. */
export const FAQ_ANSWERS: Partial<Record<Intent, Record<Language, string>>> & Record<FaqIntent, Record<Language, string>> = {
  parking: {
    en: "Yes — one free private parking space is included with the apartment.",
    me: "Da — u cijenu apartmana je uključeno jedno besplatno privatno parking mjesto.",
    ru: "Да — в апартаментах есть одно бесплатное частное парковочное место.",
  },
  checkin: {
    en: "Check-in is from 14:00.",
    me: "Prijava (check-in) je moguća od 14:00 časova.",
    ru: "Заселение возможно с 14:00.",
  },
  checkout: {
    en: "Check-out is by 10:00.",
    me: "Odjava (check-out) je do 10:00 časova.",
    ru: "Выезд — до 10:00.",
  },
  pets: {
    en: "Small pets are allowed with prior approval from the host.",
    me: "Manji ljubimci su dozvoljeni uz prethodnu saglasnost domaćina.",
    ru: "Небольшие домашние животные допускаются по предварительному согласованию с хозяином.",
  },
  wifi: {
    en: "Yes, free Wi-Fi is available throughout the apartment.",
    me: "Da, besplatan Wi-Fi je dostupan u cijelom apartmanu.",
    ru: "Да, бесплатный Wi-Fi доступен на всей территории апартаментов.",
  },
  smoking: {
    en: "Smoking is not allowed inside the apartment.",
    me: "Pušenje unutar apartmana nije dozvoljeno.",
    ru: "Курение в апартаментах не разрешено.",
  },
  beach: {
    en: "The nearest beach is approximately 8 minutes on foot.",
    me: "Najbliža plaža je udaljena oko 8 minuta pješke.",
    ru: "Ближайший пляж находится примерно в 8 минутах ходьбы.",
  },
  old_town: {
    en: "Budva's Old Town is approximately 15 minutes on foot.",
    me: "Stari grad Budva je udaljen oko 15 minuta pješke.",
    ru: "Старый город Будвы находится примерно в 15 минутах ходьбы.",
  },
  airport_transfer: {
    en: "An airport transfer can be arranged on request. The price needs to be confirmed directly with the host — I can pass your enquiry along if you'd like.",
    me: "Transfer sa aerodroma se može organizovati na upit. Cijenu je potrebno potvrditi direktno sa domaćinom — mogu proslijediti vaš upit ako želite.",
    ru: "Трансфер из аэропорта можно организовать по запросу. Стоимость нужно уточнить напрямую у хозяина — я могу передать ваш запрос, если хотите.",
  },
  payment: {
    en: "Payment is confirmed directly with the host — I don't process payments here in the chat.",
    me: "Način plaćanja se dogovara direktno sa domaćinom — ja u čet-u ne obrađujem plaćanja.",
    ru: "Оплата согласовывается напрямую с хозяином — в этом чате я платежи не обрабатываю.",
  },
  price: {
    en: "The nightly price depends on your dates and is confirmed directly by the host. I can start a quick booking enquiry so the host can confirm pricing and availability — would you like to do that?",
    me: "Cijena po noćenju zavisi od datuma i potvrđuje je direktno domaćin. Mogu pokrenuti kratak upit za rezervaciju kako bi domaćin potvrdio cijenu i dostupnost — želite li to?",
    ru: "Стоимость за ночь зависит от дат и подтверждается непосредственно хозяином. Я могу начать короткий запрос на бронирование, чтобы хозяин подтвердил цену и наличие свободных дат — хотите?",
  },
};

/**
 * A representative question for each FAQ category — used only where a
 * display/seed question is needed (the dashboard's knowledge editor,
 * the owner-side onboarding repair action). Keep in sync with the
 * seed data in supabase/migrations/20260201000300_onboarding.sql and
 * 20260202000000_repair_onboarding.sql.
 */
export const FAQ_QUESTIONS: Record<FaqIntent, string> = {
  parking: "Is parking available?",
  checkin: "What time is check-in?",
  checkout: "What time is check-out?",
  pets: "Are pets allowed?",
  wifi: "Is there Wi-Fi?",
  smoking: "Is smoking allowed?",
  beach: "How far is the beach?",
  old_town: "How far is the Old Town?",
  airport_transfer: "Can you arrange an airport transfer?",
  payment: "How do I pay?",
  price: "How much does it cost per night?",
};
