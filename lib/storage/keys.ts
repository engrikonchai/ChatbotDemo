/**
 * Versioned LocalStorage keys. Bumping the version (rather than reusing
 * a key) lets a future release change the stored shape without having
 * to migrate — old data is simply left behind under the old key.
 */
const NAMESPACE = "adria-stay-budva";
const VERSION = "v1";

function key(name: string): string {
  return `${NAMESPACE}:${VERSION}:${name}`;
}

export const STORAGE_KEYS = {
  leads: key("leads"),
  conversations: key("conversations"),
  settings: key("settings"),
} as const;
