import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { NEW_WIDGET_ID, NEW_WIDGET_OPEN_EVENT, NEW_WIDGET_SCRIPT_SRC } from "@/lib/widget/new-widget-config";

/**
 * Focused regression coverage for the ai-receptionist-platform widget
 * migration:
 *
 *  - the old in-house widget (components/chat/ChatWidget.tsx) is no
 *    longer mounted on the homepage, so it can never appear alongside
 *    the new one;
 *  - the new platform script is installed exactly once, globally, via
 *    next/script in the root layout;
 *  - the "Check availability" CTAs (Navbar, Hero) open the new widget
 *    by dispatching its documented `ai-receptionist:open` custom event
 *    — never by reaching into its shadow DOM or internal markup.
 */

const root = path.resolve(import.meta.dirname, "..");
const pageSource = readFileSync(path.join(root, "app/page.tsx"), "utf8");
const layoutSource = readFileSync(path.join(root, "app/layout.tsx"), "utf8");

/** Strips `//` line comments so source-text assertions ignore explanatory prose. */
function withoutLineComments(source: string): string {
  return source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

const pageCode = withoutLineComments(pageSource);

describe("old widget UI mounting is disabled, not deleted", () => {
  it("app/page.tsx no longer imports or renders ChatWidget", () => {
    expect(pageCode).not.toMatch(/from ["']@\/components\/chat\/ChatWidget["']/);
    expect(pageCode).not.toMatch(/<ChatWidget\b/);
  });

  it("components/chat/ChatWidget.tsx still exists (kept for rollback, not deleted)", () => {
    expect(() => readFileSync(path.join(root, "components/chat/ChatWidget.tsx"), "utf8")).not.toThrow();
  });

  it("the old widget's backing API routes still exist (kept for rollback, not deleted)", () => {
    for (const route of ["session", "message", "lead", "handoff"]) {
      expect(() => readFileSync(path.join(root, `app/api/widget/${route}/route.ts`), "utf8")).not.toThrow();
    }
  });

  it("rendering Navbar + Hero without ChatWidget mounts no 'Ask Adria' toggle button", () => {
    render(
      <>
        <Navbar />
        <Hero />
      </>,
    );
    expect(screen.queryByRole("button", { name: /Ask Adria/i })).not.toBeInTheDocument();
    cleanup();
  });
});

describe("the new ai-receptionist-platform script is installed exactly once, globally", () => {
  it("app/layout.tsx renders next/script wired to the shared widget config (single source of truth)", () => {
    expect(layoutSource).toMatch(/from ["']next\/script["']/);
    expect(layoutSource).toMatch(/from ["']@\/lib\/widget\/new-widget-config["']/);
    expect(layoutSource).toMatch(/<Script[\s\S]*?src=\{NEW_WIDGET_SCRIPT_SRC\}[\s\S]*?\/>/);
    expect(layoutSource).toMatch(/<Script[\s\S]*?data-widget-id=\{NEW_WIDGET_ID\}[\s\S]*?\/>/);
  });

  it("the shared config resolves to the exact snippet's src and widget id", () => {
    expect(NEW_WIDGET_SCRIPT_SRC).toBe("https://ai-receptionist-platform-beta.vercel.app/widget-loader.js");
    expect(NEW_WIDGET_ID).toBe("e3f351d2-82cb-4882-b668-c68f1e008bc1");
  });

  it("contains exactly one <Script ...> element", () => {
    const matches = layoutSource.match(/<Script\b/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("no other app/ or components/ file also embeds the widget script src (no duplicate mounting)", () => {
    function listSourceFiles(dir: string): string[] {
      let results: string[] = [];
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
        const fullPath = path.join(dir, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) results = results.concat(listSourceFiles(fullPath));
        else if (/\.(ts|tsx)$/.test(entry)) results.push(fullPath);
      }
      return results;
    }

    const files = [
      ...listSourceFiles(path.join(root, "app")),
      ...listSourceFiles(path.join(root, "components")),
    ].filter(
      (f) => f !== path.join(root, "app/layout.tsx") && f !== path.join(root, "lib/widget/new-widget-config.ts"),
    );

    const offenders = files.filter((f) => readFileSync(f, "utf8").includes(NEW_WIDGET_SCRIPT_SRC));
    expect(offenders).toEqual([]);
  });

  it("does not expose any server secret alongside the widget id (public value only)", () => {
    expect(layoutSource).not.toMatch(/service[_-]?role/i);
    expect(layoutSource).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(layoutSource).not.toMatch(/process\.env\.[A-Z_]*SECRET/);
  });
});

describe("Check availability CTAs open the new widget via its documented public event", () => {
  it("does not reach into the new widget's shadow DOM, internal markup, or use MutationObserver", () => {
    const bridgeSource = readFileSync(path.join(root, "lib/widget/open-new-widget.ts"), "utf8");
    expect(bridgeSource).not.toMatch(/shadowRoot/);
    expect(bridgeSource).not.toMatch(/MutationObserver/);
    expect(bridgeSource).not.toMatch(/querySelector/);
  });

  it("Navbar's desktop CTA dispatches ai-receptionist:open with the correct widgetId", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Check availability" }));

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ widgetId: string }>;
    expect(event.detail).toEqual({ widgetId: NEW_WIDGET_ID });

    window.removeEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    cleanup();
  });

  it("Navbar's mobile-menu CTA dispatches ai-receptionist:open with the correct widgetId", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
    await user.click(within(mobileNav).getByRole("button", { name: "Check availability" }));

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ widgetId: string }>;
    expect(event.detail).toEqual({ widgetId: NEW_WIDGET_ID });

    window.removeEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    cleanup();
  });

  it("Hero's CTA dispatches ai-receptionist:open with the correct widgetId", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    window.addEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    render(<Hero />);

    await user.click(screen.getByRole("button", { name: "Check availability" }));

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ widgetId: string }>;
    expect(event.detail).toEqual({ widgetId: NEW_WIDGET_ID });

    window.removeEventListener(NEW_WIDGET_OPEN_EVENT, handler);
    cleanup();
  });

  it("every Check-availability CTA is a real accessible type=button element", () => {
    render(
      <>
        <Navbar />
        <Hero />
      </>,
    );
    for (const button of screen.getAllByRole("button", { name: "Check availability" })) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }
    cleanup();
  });
});
