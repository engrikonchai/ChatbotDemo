import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ChatWidget } from "@/components/chat/ChatWidget";
import * as widgetApi from "@/lib/client/widget-api";

/**
 * Regression coverage for the "Check availability" button.
 *
 * Root cause of the production bug: `app/globals.css` set
 * `overflow-x: hidden` on `<body>`, and the floating chat widget is a
 * direct fixed-position child of `<body>`. iOS Safari treats an
 * overflow-clipped body as the containing block for `position: fixed`
 * descendants, which pushed the widget off-screen — so tapping "Check
 * availability" correctly ran its click handler and correctly flipped
 * the widget's `isOpen` state (confirmed here, and confirmed live via a
 * Chromium mobile-viewport repro against the real dev server), but the
 * panel never became visible on that engine. The CSS fix lives in
 * `app/globals.css` (see tests/no-horizontal-overflow.test.ts for its
 * regression guard); this file covers the click/touch/keyboard/state
 * side of the mechanism — the part jsdom *can* verify — using the real
 * Navbar, Hero and ChatWidget components together, exactly as they're
 * wired on the homepage.
 */

vi.mock("@/lib/client/widget-api", () => ({
  startWidgetSession: vi.fn(),
  sendWidgetMessage: vi.fn(),
}));

const mockedStart = vi.mocked(widgetApi.startWidgetSession);
const mockedSend = vi.mocked(widgetApi.sendWidgetMessage);

const WIDGET_ID = "11111111-1111-4111-8111-111111111111";

function sessionResponse() {
  return {
    ok: true as const,
    data: {
      enabled: true,
      conversationId: "conv-1",
      language: "en" as const,
      flowActive: false,
      messages: [{ id: "m1", role: "assistant" as const, text: "Hello! How can I help?", createdAt: new Date().toISOString() }],
      widget: { title: "Adria Assistant", humanHandoffEnabled: false },
    },
  };
}

function messageResponse() {
  return {
    ok: true as const,
    data: {
      messages: [{ id: "m2", role: "assistant" as const, text: "Sure — when would you like to stay?", createdAt: new Date().toISOString() }],
      language: "en" as const,
      flowActive: true,
      suggestedReplies: [] as string[],
      leadCreated: false,
      leadReference: null,
    },
  };
}

function renderHomepage() {
  return render(
    <>
      <Navbar />
      <Hero />
      <ChatWidget publicWidgetId={WIDGET_ID} />
    </>,
  );
}

function getCheckAvailabilityButtons() {
  return screen.getAllByRole("button", { name: "Check availability" });
}

function queryToggleButton() {
  return screen.queryByRole("button", { name: /Ask Adria/i });
}

beforeEach(() => {
  mockedStart.mockReset().mockResolvedValue(sessionResponse());
  mockedSend.mockReset().mockResolvedValue(messageResponse());
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("Check availability CTA — opens the shared chat widget", () => {
  it("is a real accessible button with type=button (never navigates, never submits a form)", () => {
    renderHomepage();
    for (const button of getCheckAvailabilityButtons()) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("desktop mouse click opens the widget and focuses the message input", async () => {
    const user = userEvent.setup();
    renderHomepage();

    expect(queryToggleButton()).toBeInTheDocument();
    await user.click(getCheckAvailabilityButtons()[0]);

    expect(queryToggleButton()).not.toBeInTheDocument();
    const dialog = await screen.findByRole("dialog");
    const input = await screen.findByPlaceholderText("Type your message…");
    expect(dialog).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("touch tap activation opens the widget", async () => {
    renderHomepage();
    const button = getCheckAvailabilityButtons()[0];

    // Real touch devices fire pointerdown/touchstart/touchend and the
    // browser then synthesizes a single "click" — this is what the
    // button's onClick handler actually receives on mobile.
    fireEvent.pointerDown(button, { pointerType: "touch" });
    fireEvent.touchStart(button);
    fireEvent.touchEnd(button);
    fireEvent.pointerUp(button, { pointerType: "touch" });
    fireEvent.click(button);

    expect(queryToggleButton()).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("keyboard activation (Enter on a focused button) opens the widget", async () => {
    const user = userEvent.setup();
    renderHomepage();
    const button = getCheckAvailabilityButtons()[0];

    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(queryToggleButton()).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("keyboard activation (Space on a focused button) also opens the widget", async () => {
    const user = userEvent.setup();
    renderHomepage();
    const button = getCheckAvailabilityButtons()[0];

    button.focus();
    await user.keyboard(" ");

    expect(queryToggleButton()).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("multiple rapid clicks do not create duplicate widgets or duplicate session requests", async () => {
    const user = userEvent.setup();
    renderHomepage();
    const button = getCheckAvailabilityButtons()[0];

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    // Guards against the exact race the old 150ms setTimeout was papering
    // over: ensureConversation() must only ever start one session.
    expect(mockedStart).toHaveBeenCalledTimes(1);
  });

  it("closing and reopening the widget works", async () => {
    const user = userEvent.setup();
    renderHomepage();
    const button = getCheckAvailabilityButtons()[0];

    await user.click(button);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close chat" }));
    expect(queryToggleButton()).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(button);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("every other Check-availability button on the page uses the same mechanism and still works", async () => {
    const user = userEvent.setup();
    renderHomepage();
    const buttons = getCheckAvailabilityButtons();
    expect(buttons.length).toBeGreaterThan(1);

    for (const button of buttons) {
      cleanup();
      mockedStart.mockClear();
      renderHomepage();
      await user.click(screen.getAllByRole("button", { name: "Check availability" })[buttons.indexOf(button)]);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    }
  });

  it("the floating Ask Adria button (not driven by the event bus) still opens the widget directly", async () => {
    const user = userEvent.setup();
    renderHomepage();
    await user.click(screen.getByRole("button", { name: /Ask Adria/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
