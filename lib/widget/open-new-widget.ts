"use client";

import { NEW_WIDGET_ID, NEW_WIDGET_OPEN_EVENT } from "@/lib/widget/new-widget-config";

/**
 * Opens the ai-receptionist-platform widget installed globally in
 * app/layout.tsx. The platform widget listens for this event itself
 * (a stable, documented public API — see ai-receptionist-platform's
 * widget-loader.js) rather than being reached into via its internal DOM
 * or shadow root, so this stays correct even if the platform changes
 * its internal markup.
 */
export function openNewWidget(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEW_WIDGET_OPEN_EVENT, { detail: { widgetId: NEW_WIDGET_ID } }));
}
