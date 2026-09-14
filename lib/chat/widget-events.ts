"use client";

/**
 * A tiny window-event bus so page content (nav links, the "Check
 * availability" CTA) can open the chat widget without prop-drilling a
 * React context through the whole landing page tree.
 */

const EVENT_NAME = "adria:open-chat";

export interface OpenChatDetail {
  /** When true, immediately starts the booking-enquiry flow. */
  startBooking?: boolean;
}

export function openChatWidget(detail: OpenChatDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(EVENT_NAME, { detail }));
}

export function onOpenChatWidget(handler: (detail: OpenChatDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    handler((event as CustomEvent<OpenChatDetail>).detail ?? {});
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
