/**
 * Configuration for the ai-receptionist-platform embeddable widget,
 * which replaces the old in-house chat widget
 * (components/chat/ChatWidget.tsx — kept, but no longer mounted; see
 * app/page.tsx). Both values below are public by design: the script is
 * served from the platform's own public CDN path, and the widget id is
 * a `public_widget_id`-style identifier the platform's unauthenticated
 * /api/public-widget/* routes validate (origin + enabled state) before
 * ever touching a database — never a secret or API key. Kept in one
 * place so the script tag (app/layout.tsx) and the CTA event dispatcher
 * (lib/widget/open-new-widget.ts) can't drift out of sync.
 */
export const NEW_WIDGET_SCRIPT_SRC = "https://ai-receptionist-platform-beta.vercel.app/widget-loader.js";
export const NEW_WIDGET_ID = "e3f351d2-82cb-4882-b668-c68f1e008bc1";

/** Custom event the platform widget listens for to open itself on demand. */
export const NEW_WIDGET_OPEN_EVENT = "ai-receptionist:open";
