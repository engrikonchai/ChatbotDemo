import { describe, expect, it } from "vitest";
import { detectIntent } from "@/lib/chat/intent-detection";

describe("detectIntent", () => {
  it("recognises the parking intent in all three languages", () => {
    expect(detectIntent("Is parking available?")).toBe("parking");
    expect(detectIntent("Imate li parking?")).toBe("parking");
    expect(detectIntent("Есть ли парковка?")).toBe("parking");
  });

  it("recognises check-in and check-out separately", () => {
    expect(detectIntent("What time is check-in?")).toBe("checkin");
    expect(detectIntent("Kada je prijava?")).toBe("checkin");
    expect(detectIntent("What time is check-out?")).toBe("checkout");
    expect(detectIntent("Kada je odjava?")).toBe("checkout");
  });

  it("recognises pets, wifi and smoking questions", () => {
    expect(detectIntent("Are pets allowed?")).toBe("pets");
    expect(detectIntent("Da li su ljubimci dozvoljeni?")).toBe("pets");
    expect(detectIntent("Do you have wifi?")).toBe("wifi");
    expect(detectIntent("Is smoking allowed?")).toBe("smoking");
  });

  it("recognises location questions", () => {
    expect(detectIntent("How far is the beach?")).toBe("beach");
    expect(detectIntent("How far is the Old Town?")).toBe("old_town");
  });

  it("recognises airport transfer and payment/price questions", () => {
    expect(detectIntent("Can you arrange an airport transfer?")).toBe("airport_transfer");
    expect(detectIntent("How much does it cost per night?")).toBe("price");
    expect(detectIntent("How can I pay?")).toBe("payment");
  });

  it("recognises an availability/booking request", () => {
    expect(detectIntent("I want to check availability")).toBe("availability");
    expect(detectIntent("Želim da provjerim dostupnost")).toBe("availability");
    expect(detectIntent("Хочу проверить свободные даты")).toBe("availability");
  });

  it("recognises requests for a human in all three languages", () => {
    expect(detectIntent("Can I talk to a human?")).toBe("human");
    expect(detectIntent("Mogu li razgovarati sa vlasnikom?")).toBe("human");
    expect(detectIntent("Можно поговорить с хозяином?")).toBe("human");
  });

  it("prioritises human hand-off over an incidental mention of availability", () => {
    expect(detectIntent("I'd like to speak to the host about availability")).toBe("human");
  });

  it("recognises greetings", () => {
    expect(detectIntent("Hello!")).toBe("greeting");
    expect(detectIntent("Zdravo")).toBe("greeting");
    expect(detectIntent("Привет")).toBe("greeting");
  });

  it("falls back to unknown for unrelated text", () => {
    expect(detectIntent("What's the meaning of life?")).toBe("unknown");
    expect(detectIntent("asdkjaslkdj")).toBe("unknown");
    expect(detectIntent("")).toBe("unknown");
  });
});
