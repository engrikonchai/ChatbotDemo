import type { Language } from "@/lib/chat/types";

/**
 * Lower-cases and strips diacritics so "Šta", "sta" and "šta" all match
 * the same keyword. Cyrillic text is left untouched (it has no
 * decomposable diacritics that matter here).
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const CYRILLIC_PATTERN = /[Ѐ-ӿ]/;

// Keywords are matched as whole words against normalized text.
const ME_KEYWORDS = [
  "zdravo",
  "pozdrav",
  "dobar dan",
  "dobro jutro",
  "dobro vece",
  "cao",
  "bok",
  "hvala",
  "molim",
  "imate li",
  "da li",
  "kada je",
  "koliko",
  "gdje",
  "gde",
  "sta",
  "kako",
  "parkiranje",
  "ljubimci",
  "ljubimac",
  "zivotinja",
  "prijava",
  "odjava",
  "dolazak",
  "odlazak",
  "dostupnost",
  "dostupno",
  "rezervacija",
  "rezervisati",
  "zelim",
  "zelim da",
  "mozete li",
  "plaza",
  "stari grad",
  "aerodrom",
  "prevoz",
  "cijena",
  "cena",
  "kostati",
  "placanje",
  "pusenje",
  "wifi internet",
  "covjek",
  "covek",
  "osoba",
  "vlasnik",
  "menadzer",
  "domacin",
];

const EN_KEYWORDS = [
  "hello",
  "hi",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "please",
  "thank",
  "thanks",
  "is there",
  "are there",
  "do you",
  "what time",
  "how much",
  "where",
  "when",
  "available",
  "availability",
  "parking",
  "pet",
  "pets",
  "check-in",
  "check in",
  "checkin",
  "check-out",
  "check out",
  "checkout",
  "wifi",
  "wi-fi",
  "internet",
  "smoking",
  "beach",
  "old town",
  "airport",
  "transfer",
  "price",
  "cost",
  "payment",
  "book",
  "booking",
  "reserve",
  "human",
  "person",
  "owner",
  "manager",
  "host",
  "the",
  "you",
];

/**
 * Strips everything but letters/digits/spaces and collapses whitespace,
 * then pads with a leading/trailing space. Used so keyword matching
 * checks for whole words or phrases, not arbitrary substrings — e.g. so
 * "swim" doesn't match inside "swimming", or "no" inside "not".
 */
function tokenPad(text: string): string {
  const cleaned = text
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ` ${cleaned} `;
}

/**
 * True when any keyword appears inside `text`. Short single words (fewer
 * than 5 letters, e.g. "no", "sea", "pay") are matched as whole
 * words/phrases only, so "sea" doesn't match inside "season" and "no"
 * doesn't match inside "not". Longer single words (5+ letters, e.g.
 * "dostupnost") are matched as substrings, which is deliberately
 * forgiving of inflected endings common in BHS/Russian ("dostupn" would
 * also match "dostupno") while staying long enough to avoid accidental
 * collisions. Multi-word phrases always require a whole-phrase match.
 */
export function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const padded = tokenPad(text);
  return keywords.some((keyword) => {
    const trimmed = keyword.trim();
    const isPhrase = /\s/.test(trimmed);
    const isShortWord = !isPhrase && trimmed.replace(/[^\p{L}\p{N}]/gu, "").length < 5;
    if (isPhrase || isShortWord) {
      return padded.includes(tokenPad(trimmed));
    }
    return padded.includes(trimmed);
  });
}

function containsAny(text: string, keywords: string[]): boolean {
  return containsAnyKeyword(text, keywords);
}

/**
 * Detects the language of a short chat message using simple keyword
 * matching. Returns `null` when the text is too short or ambiguous to
 * call confidently (e.g. a bare date like "10.06"), so the caller can
 * fall back to the conversation's current language instead of flapping.
 */
export function detectLanguage(rawText: string): Language | null {
  const text = rawText.trim();
  if (!text) return null;

  if (CYRILLIC_PATTERN.test(text)) return "ru";

  const normalized = normalizeText(text);
  // Require at least one letter — pure numbers/dates/punctuation are inconclusive.
  if (!/[a-z]/.test(normalized)) return null;

  const meHit = containsAny(normalized, ME_KEYWORDS);
  const enHit = containsAny(normalized, EN_KEYWORDS);

  if (meHit && !enHit) return "me";
  if (enHit && !meHit) return "en";
  if (enHit && meHit) {
    // Both matched (e.g. shared word like "parking") — prefer the
    // language with the longer/more specific keyword hit.
    const meLength = Math.max(...ME_KEYWORDS.filter((k) => containsAnyKeyword(normalized, [k])).map((k) => k.length));
    const enLength = Math.max(...EN_KEYWORDS.filter((k) => containsAnyKeyword(normalized, [k])).map((k) => k.length));
    return meLength >= enLength ? "me" : "en";
  }

  return null;
}

/** Resolves the language to use for a turn: detected, else the current one, else English. */
export function resolveLanguage(rawText: string, current: Language | undefined): Language {
  return detectLanguage(rawText) ?? current ?? "en";
}
