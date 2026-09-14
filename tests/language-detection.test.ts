import { describe, expect, it } from "vitest";
import { detectLanguage, resolveLanguage } from "@/lib/chat/language-detection";

describe("detectLanguage", () => {
  it("detects English from common keywords", () => {
    expect(detectLanguage("Is parking available?")).toBe("en");
    expect(detectLanguage("What time is check-in?")).toBe("en");
  });

  it("detects Montenegrin/Serbian/Bosnian/Croatian from common keywords", () => {
    expect(detectLanguage("Imate li parking?")).toBe("me");
    expect(detectLanguage("Kada je prijava?")).toBe("me");
    expect(detectLanguage("Da li su ljubimci dozvoljeni?")).toBe("me");
  });

  it("detects Russian from Cyrillic script", () => {
    expect(detectLanguage("Есть ли парковка?")).toBe("ru");
    expect(detectLanguage("Во сколько заселение?")).toBe("ru");
  });

  it("returns null for inconclusive text such as bare dates or numbers", () => {
    expect(detectLanguage("10.06.2026")).toBeNull();
    expect(detectLanguage("2")).toBeNull();
    expect(detectLanguage("")).toBeNull();
  });

  it("is case-insensitive and diacritic-insensitive for BHS text", () => {
    expect(detectLanguage("ŽELIM DA PROVJERIM DOSTUPNOST")).toBe("me");
    expect(detectLanguage("zelim da provjerim dostupnost")).toBe("me");
  });
});

describe("resolveLanguage", () => {
  it("falls back to the current conversation language when inconclusive", () => {
    expect(resolveLanguage("10.06.2026", "ru")).toBe("ru");
    expect(resolveLanguage("3", "me")).toBe("me");
  });

  it("falls back to English when there is no current language either", () => {
    expect(resolveLanguage("10.06.2026", undefined)).toBe("en");
  });

  it("prefers a freshly detected language over the current one", () => {
    expect(resolveLanguage("Hello there", "ru")).toBe("en");
  });
});
