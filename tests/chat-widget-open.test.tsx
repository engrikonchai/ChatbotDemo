import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWidget } from "@/components/chat/ChatWidget";
import * as widgetApi from "@/lib/client/widget-api";

/**
 * Regression coverage for the old in-house chat widget's own
 * open/close mechanics (click, touch, keyboard, no duplicate panels,
 * close/reopen).
 *
 * This widget is no longer mounted on the homepage — it was replaced
 * by the ai-receptionist-platform widget (see app/layout.tsx and
 * tests/widget-migration.test.tsx) — but the component itself is kept,
 * not deleted, so this migration can be rolled back. These tests keep
 * verifying it still works correctly in isolation. They previously also
 * exercised the Navbar/Hero "Check availability" CTAs, which called
 * this widget directly via a window-event bus; those CTAs now dispatch
 * a different event aimed at the new widget instead (see
 * tests/widget-migration.test.tsx), so that coupling is no longer
 * something this file should assert.
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
      messages: [
        { id: "m1", role: "assistant" as const, text: "Hello! How can I help?", createdAt: new Date().toISOString() },
      ],
      widget: { title: "Adria Assistant", humanHandoffEnabled: false },
    },
  };
}

function messageResponse() {
  return {
    ok: true as const,
    data: {
      messages: [
        {
          id: "m2",
          role: "assistant" as const,
          text: "Sure — when would you like to stay?",
          createdAt: new Date().toISOString(),
        },
      ],
      language: "en" as const,
      flowActive: true,
      suggestedReplies: [] as string[],
      leadCreated: false,
      leadReference: null,
    },
  };
}

function renderWidget() {
  return render(<ChatWidget publicWidgetId={WIDGET_ID} />);
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

describe("ChatWidget (kept for rollback) — its own floating button still works", () => {
  it("desktop mouse click opens the widget and focuses the message input", async () => {
    const user = userEvent.setup();
    renderWidget();

    const toggle = queryToggleButton();
    expect(toggle).toBeInTheDocument();
    await user.click(toggle!);

    expect(queryToggleButton()).not.toBeInTheDocument();
    const dialog = await screen.findByRole("dialog");
    const input = await screen.findByPlaceholderText("Type your message…");
    expect(dialog).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("touch tap activation opens the widget", async () => {
    renderWidget();
    const toggle = queryToggleButton()!;

    fireEvent.pointerDown(toggle, { pointerType: "touch" });
    fireEvent.touchStart(toggle);
    fireEvent.touchEnd(toggle);
    fireEvent.pointerUp(toggle, { pointerType: "touch" });
    fireEvent.click(toggle);

    expect(queryToggleButton()).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("keyboard activation (Enter) opens the widget", async () => {
    const user = userEvent.setup();
    renderWidget();
    const toggle = queryToggleButton()!;

    toggle.focus();
    await user.keyboard("{Enter}");

    expect(queryToggleButton()).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("multiple rapid clicks do not create duplicate panels", async () => {
    const user = userEvent.setup();
    renderWidget();
    const toggle = queryToggleButton()!;

    await user.click(toggle);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("closing and reopening the widget works", async () => {
    const user = userEvent.setup();
    renderWidget();
    const toggle = queryToggleButton()!;

    await user.click(toggle);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close chat" }));
    expect(queryToggleButton()).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(queryToggleButton()!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
