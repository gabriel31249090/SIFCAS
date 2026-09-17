import fs from "node:fs";
import path from "node:path";

const sourceRoots = ["app", "components", "lib"];
const sourceFiles = [];
const pageRoutes = [];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else callback(full);
  }
}

sourceRoots.forEach((root) => walk(root, (file) => {
  if (/\.(tsx|ts|jsx|js)$/.test(file)) sourceFiles.push(file);
}));

walk("app", (file) => {
  const normalized = file.split(path.sep).join("/");
  if (!/(?:^|\/)(page|route)\.(tsx|ts|jsx|js)$/.test(normalized)) return;
  let route = normalized.replace(/^app/, "").replace(/\/(page|route)\.(tsx|ts|jsx|js)$/, "") || "/";
  route = route.replace(/\/(\([^/]+\)|@[^/]+)/g, "");
  pageRoutes.push(route || "/");
});

const routeRegexes = pageRoutes.map((route) => {
  const pattern = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\\\.\\\.\\\.[^\]]+\\\]/g, ".+")
    .replace(/\\\[[^\]]+\\\]/g, "[^/]+");
  return new RegExp(`^${pattern || "/"}/?$`);
});

const ignoredPrefixes = ["/_next", "/favicon.ico"];
const missing = [];

function routeExists(href) {
  const pathname = href.split(/[?#]/)[0] || "/";
  if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  return routeRegexes.some((regex) => regex.test(pathname));
}

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const candidates = [];

  for (const match of source.matchAll(/\bhref\s*=\s*["'](\/[A-Za-z0-9_./?=&%-]*)["']/g)) candidates.push([match[1], match.index ?? 0]);
  for (const match of source.matchAll(/\bredirect\(\s*["'](\/[A-Za-z0-9_./?=&%-]*)["']\s*\)/g)) candidates.push([match[1], match.index ?? 0]);

  for (const [href, index] of candidates) {
    if (!routeExists(href)) {
      const line = source.slice(0, index).split("\n").length;
      missing.push(`${file}:${line} — rota interna não encontrada: ${href}`);
    }
  }
}

if (missing.length) {
  console.error("\nSIFCAS route audit failed:\n");
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`SIFCAS route audit passed: ${pageRoutes.length} app routes and ${sourceFiles.length} source files checked.`);
