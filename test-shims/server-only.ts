// Test-only stand-in for the `server-only` package.
//
// The real package unconditionally throws on import and relies on a
// bundler-level `react-server` export condition to swap in a no-op
// build when actually bundled for the server. Vitest runs in plain
// Node/jsdom without that condition, so importing the real package
// during tests would throw immediately — this empty module is aliased
// in its place (see vitest.config.mts) purely so files that start with
// `import "server-only"` can still be unit tested. It has no effect on
// the real Next.js build, which still enforces the real guarantee.
export {};
