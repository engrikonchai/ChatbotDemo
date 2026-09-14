import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // The real `server-only` package throws unconditionally unless a
      // bundler resolves its `react-server` export condition (which
      // Vitest doesn't). Swap in a no-op so server-only modules can
      // still be unit tested — see test-shims/server-only.ts.
      "server-only": path.resolve(rootDir, "test-shims/server-only.ts"),
      "@": rootDir,
    },
  },
});
