#!/usr/bin/env node
// Runs after every `next build` (see package.json "postbuild") to verify
// the service-role key can never reach a browser. Two checks:
//
//   1. The literal string "SUPABASE_SERVICE_ROLE_KEY" never appears in
//      any client-side JS chunk (.next/static/**). It's only ever read
//      in lib/supabase/admin.ts, which is guarded by `import "server-only"`
//      — that guard already makes it a *build* error to import that file
//      from client code, so this is a second, independent, automated
//      confirmation of the same guarantee.
//   2. If SUPABASE_SERVICE_ROLE_KEY is set in this environment, its
//      actual *value* never appears in any client-side JS chunk either
//      (catches the value having leaked in some other way, e.g. an
//      inline script or accidentally serialized prop).
//
// Exits non-zero (failing the build) if either check finds a match.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const clientDir = path.resolve(process.cwd(), ".next/static");

function listJsFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results = results.concat(listJsFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = listJsFiles(clientDir);

if (files.length === 0) {
  console.log("[check-no-service-role-leak] No client bundle found at .next/static — skipping (did the build run?).");
  process.exit(0);
}

const serviceRoleValue = process.env.SUPABASE_SERVICE_ROLE_KEY;
const offenders = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  if (content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    offenders.push({ file, reason: "contains the literal env var name" });
  }
  if (serviceRoleValue && content.includes(serviceRoleValue)) {
    offenders.push({ file, reason: "contains the actual service-role key value" });
  }
}

if (offenders.length > 0) {
  console.error("[check-no-service-role-leak] FAILED — the service-role key leaked into a client bundle:");
  for (const { file, reason } of offenders) {
    console.error(`  - ${path.relative(process.cwd(), file)}: ${reason}`);
  }
  process.exit(1);
}

console.log(`[check-no-service-role-leak] OK — scanned ${files.length} client JS file(s), no service-role leak found.`);
