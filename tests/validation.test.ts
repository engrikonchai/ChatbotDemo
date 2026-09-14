import { describe, expect, it } from "vitest";
import {
  validateCheckInDate,
  validateCheckOutDate,
  validateContact,
  validateGuestCount,
  validateName,
} from "@/lib/utils/validation";
import { parseFlexibleDate, isCheckOutAfterCheckIn, isPastDate, toISODate } from "@/lib/utils/date";

function futureISODate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toISODate(date);
}

describe("parseFlexibleDate", () => {
  it("parses ISO dates", () => {
    expect(parseFlexibleDate("2026-06-10")).toBe("2026-06-10");
  });

  it("parses day.month.year and day/month/year dates", () => {
    expect(parseFlexibleDate("10.06.2026")).toBe("2026-06-10");
    expect(parseFlexibleDate("10/06/2026")).toBe("2026-06-10");
  });

  it("returns null for unparsable text", () => {
    expect(parseFlexibleDate("next friday")).toBeNull();
    expect(parseFlexibleDate("not a date")).toBeNull();
  });

  it("rejects impossible calendar dates", () => {
    expect(parseFlexibleDate("31.02.2026")).toBeNull();
  });
});

describe("date range helpers", () => {
  it("flags a date before today as past", () => {
    expect(isPastDate("2000-01-01")).toBe(true);
    expect(isPastDate(futureISODate(5))).toBe(false);
  });

  it("requires check-out to be strictly after check-in", () => {
    expect(isCheckOutAfterCheckIn("2026-06-10", "2026-06-14")).toBe(true);
    expect(isCheckOutAfterCheckIn("2026-06-10", "2026-06-10")).toBe(false);
    expect(isCheckOutAfterCheckIn("2026-06-14", "2026-06-10")).toBe(false);
  });
});

describe("validateCheckInDate / validateCheckOutDate", () => {
  it("rejects an empty check-in date", () => {
    expect(validateCheckInDate(undefined).valid).toBe(false);
  });

  it("rejects a check-in date in the past", () => {
    expect(validateCheckInDate("2000-01-01").valid).toBe(false);
  });

  it("accepts a future check-in date", () => {
    expect(validateCheckInDate(futureISODate(3)).valid).toBe(true);
  });

  it("rejects a check-out date that is not after check-in", () => {
    const checkIn = futureISODate(3);
    expect(validateCheckOutDate(checkIn, checkIn).valid).toBe(false);
    expect(validateCheckOutDate(futureISODate(1), futureISODate(3)).valid).toBe(false);
  });

  it("accepts a check-out date after check-in", () => {
    expect(validateCheckOutDate(futureISODate(5), futureISODate(3)).valid).toBe(true);
  });
});

describe("validateGuestCount", () => {
  it("accepts whole numbers from 1 to 4", () => {
    expect(validateGuestCount("1").valid).toBe(true);
    expect(validateGuestCount(4).valid).toBe(true);
  });

  it("rejects zero, negative, non-integer and out-of-range values", () => {
    expect(validateGuestCount("0").valid).toBe(false);
    expect(validateGuestCount("5").valid).toBe(false);
    expect(validateGuestCount("2.5").valid).toBe(false);
    expect(validateGuestCount("-1").valid).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(validateGuestCount("two").valid).toBe(false);
    expect(validateGuestCount(undefined).valid).toBe(false);
  });
});

describe("validateName / validateContact", () => {
  it("rejects empty or whitespace-only values", () => {
    expect(validateName("").valid).toBe(false);
    expect(validateName("   ").valid).toBe(false);
    expect(validateContact("").valid).toBe(false);
  });

  it("accepts non-empty values", () => {
    expect(validateName("Ana Petrovic").valid).toBe(true);
    expect(validateContact("+382 67 000 000").valid).toBe(true);
  });
});
