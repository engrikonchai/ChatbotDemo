import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement Element.scrollTo — ChatWindow calls it to keep
// the message log scrolled to the latest message. A no-op is enough for
// tests; real scrolling behavior isn't something jsdom can verify anyway.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}
