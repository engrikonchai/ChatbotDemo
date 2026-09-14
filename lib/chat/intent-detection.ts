import type { Intent } from "@/lib/chat/types";
import { containsAnyKeyword, normalizeText } from "@/lib/chat/language-detection";

/**
 * Keyword groups per intent, covering English, Montenegrin/Serbian/
 * Bosnian/Croatian and Russian terms. Checked in priority order so that,
 * e.g., an explicit request for a human takes precedence over an
 * incidental mention of "host" inside a longer sentence.
 */
const INTENT_KEYWORDS: Array<{ intent: Intent; keywords: string[] }> = [
  {
    intent: "human",
    keywords: [
      "human",
      "real person",
      "person",
      "owner",
      "manager",
      "host",
      "talk to someone",
      "speak to someone",
      "covjek",
      "covek",
      "osoba",
      "vlasnik",
      "menadzer",
      "domacin",
      "hazjain",
      "хозяин",
      "человек",
      "менеджер",
      "оператор",
      "живой человек",
    ],
  },
  {
    intent: "availability",
    keywords: [
      "availability",
      "vacancy",
      "free dates",
      "any dates free",
      "book",
      "booking",
      "reserve",
      "reservation",
      "check availability",
      "dostupnost",
      "dostupno",
      "slobodni termini",
      "slobodno",
      "rezervacij",
      "rezervisati",
      "provjer",
      "свободн",
      "доступн",
      "бронир",
      "забронир",
    ],
  },
  {
    intent: "pets",
    keywords: [
      "pet",
      "pets",
      "dog",
      "cat",
      "animal",
      "ljubimac",
      "ljubimci",
      "pas",
      "macka",
      "zivotinja",
      "zivotinje",
      "животн",
      "питомц",
      "собак",
      "кошк",
    ],
  },
  {
    intent: "parking",
    keywords: [
      "parking",
      "park my car",
      "garage",
      "parkiranje",
      "parking mjesto",
      "auto",
      "парковка",
      "стоянка",
      "машин",
    ],
  },
  {
    intent: "checkin",
    keywords: [
      "check-in",
      "check in",
      "checkin",
      "arrival",
      "arrive",
      "prijava",
      "dolazak",
      "useljenje",
      "заселение",
      "заезд",
      "регистрация",
    ],
  },
  {
    intent: "checkout",
    keywords: [
      "check-out",
      "check out",
      "checkout",
      "departure",
      "leave the apartment",
      "odjava",
      "odlazak",
      "iseljenje",
      "выезд",
      "освобождение",
    ],
  },
  {
    intent: "wifi",
    keywords: ["wifi", "wi-fi", "wireless internet", "internet", "вайфай", "вай-фай", "интернет"],
  },
  {
    intent: "smoking",
    keywords: [
      "smoking",
      "smoke",
      "cigarette",
      "pusenje",
      "pusiti",
      "cigarete",
      "курение",
      "курить",
      "сигарет",
    ],
  },
  {
    intent: "beach",
    keywords: ["beach", "seaside", "plaza", "kupanje", "пляж", "море", "купаться"],
  },
  {
    intent: "old_town",
    keywords: [
      "old town",
      "oldtown",
      "town centre",
      "town center",
      "downtown",
      "stari grad",
      "centar grada",
      "старый город",
      "центр города",
    ],
  },
  {
    intent: "airport_transfer",
    keywords: [
      "airport",
      "transfer",
      "pickup",
      "pick up",
      "aerodrom",
      "prevoz",
      "transport sa aerodroma",
      "аэропорт",
      "трансфер",
    ],
  },
  {
    intent: "payment",
    keywords: [
      "payment",
      "pay",
      "deposit",
      "cash",
      "credit card",
      "placanje",
      "platiti",
      "depozit",
      "gotovina",
      "kes",
      "оплата",
      "платить",
      "депозит",
      "наличные",
    ],
  },
  {
    intent: "price",
    keywords: [
      "price",
      "cost",
      "how much",
      "rate",
      "nightly rate",
      "cijena",
      "cena",
      "kostati",
      "kosta",
      "koliko kosta",
      "цена",
      "стоимость",
      "сколько стоит",
    ],
  },
  {
    intent: "greeting",
    keywords: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "zdravo",
      "pozdrav",
      "dobar dan",
      "dobro jutro",
      "cao",
      "bok",
      "привет",
      "здравствуйте",
      "добрый день",
      "добрый вечер",
    ],
  },
];

/** Detects a single best-matching intent for a chat message using keyword groups. */
export function detectIntent(rawText: string): Intent {
  const normalized = normalizeText(rawText);
  if (!normalized) return "unknown";

  for (const group of INTENT_KEYWORDS) {
    if (containsAnyKeyword(normalized, group.keywords)) {
      return group.intent;
    }
  }

  return "unknown";
}
