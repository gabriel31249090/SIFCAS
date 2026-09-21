/** Only allow navigation within this application, including after URL decoding. */
export function safeInternalPath(input: unknown, fallback = "/"): string {
  if (typeof input !== "string" || !input.startsWith("/")) return fallback;
  let decoded = input;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { return fallback; }
  }
  try {
    const base = "https://sifcas.invalid";
    const url = new URL(input, base);
    if (url.origin !== base || url.pathname.startsWith("//")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
