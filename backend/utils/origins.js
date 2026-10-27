const WILDCARD = "*";

function parseOrigins(value) {
  const entries = Array.isArray(value) ? value : String(value || "").split(",");
  return entries
    .map((entry) =>
      String(entry || "")
        .trim()
        .replace(/\/+$/, ""),
    )
    .filter(Boolean);
}

function escapeRegExp(value) {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(entry) {
  const source = escapeRegExp(entry).replace(/\*/g, ".*");
  return new RegExp(`^${source}$`, "i");
}

/**
 * Builds a case-insensitive origin allowlist.
 *
 * Entries are compared as exact scheme+host origins. Entries containing `*`
 * are treated as glob patterns, e.g. `https://*.vercel.app` matches
 * `https://my-app-git-main-team.vercel.app`.
 */
function createOriginMatcher(values = []) {
  const exactOrigins = new Set();
  const patterns = [];

  for (const entry of parseOrigins(values)) {
    if (entry.includes(WILDCARD)) {
      patterns.push(compilePattern(entry));
    } else {
      exactOrigins.add(entry.toLowerCase());
    }
  }

  const isAllowed = (origin) => {
    if (typeof origin !== "string" || !origin) return false;
    const normalized = origin.trim().replace(/\/+$/, "").toLowerCase();
    if (!normalized) return false;
    if (exactOrigins.has(normalized)) return true;
    return patterns.some((pattern) => pattern.test(normalized));
  };

  return {
    exactOrigins: Array.from(exactOrigins),
    patterns: patterns.map((pattern) => pattern.source),
    isAllowed,
    matcher: (origin, callback) => callback(null, !origin || isAllowed(origin)),
  };
}

module.exports = { createOriginMatcher, parseOrigins };
