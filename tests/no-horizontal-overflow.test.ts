import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression guard for the confirmed root cause of the "Check
 * availability" button appearing to do nothing on mobile Safari:
 * `overflow-x: hidden` was declared on `<body>`, and the floating chat
 * widget (`components/chat/ChatWidget.tsx`) renders a `position: fixed`
 * element as a direct child of `<body>`. iOS Safari treats an
 * overflow-clipped body as the containing block for fixed descendants,
 * so the widget got positioned off the visible viewport even though its
 * open/close state changed correctly — confirmed via a Chromium
 * mobile-viewport repro against the local dev server, both before and
 * after this fix (WebKit itself isn't available to test in this
 * environment).
 *
 * The fix moves the horizontal-scroll guard onto `<html>`, which is not
 * a fixed element's containing block ancestor in the same way. This
 * test pins that placement so it can't silently regress back onto body.
 */

const cssSource = readFileSync(path.resolve(import.meta.dirname, "../app/globals.css"), "utf8");

function ruleBodyFor(selector: string): string | null {
  const pattern = new RegExp(`(?:^|\\n)\\s*${selector}\\s*\\{([^}]*)\\}`, "m");
  const match = cssSource.match(pattern);
  return match ? match[1] : null;
}

describe("app/globals.css — horizontal-overflow guard placement", () => {
  it("declares overflow-x: hidden on html", () => {
    const htmlRule = ruleBodyFor("html");
    expect(htmlRule).not.toBeNull();
    expect(htmlRule).toMatch(/overflow-x:\s*hidden/);
  });

  it("does not declare overflow-x: hidden on body — that breaks position:fixed descendants on iOS Safari", () => {
    const bodyRule = ruleBodyFor("body");
    expect(bodyRule).not.toBeNull();
    expect(bodyRule).not.toMatch(/overflow-x:\s*hidden/);
  });
});

describe("components/chat/ChatWidget.tsx — fixed-position widget", () => {
  const widgetSource = readFileSync(
    path.resolve(import.meta.dirname, "../components/chat/ChatWidget.tsx"),
    "utf8",
  );

  it("still uses position: fixed for the floating widget container (this test's premise)", () => {
    expect(widgetSource).toMatch(/className="fixed inset-x-0 bottom-0/);
  });
});
