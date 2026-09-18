import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components", "lib"];
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
}

roots.forEach(walk);
const errors = [];

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function report(file, source, index, message) {
  errors.push(`${file}:${lineNumber(source, index)} — ${message}`);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const executableSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

  const forbidden = [
    [/dangerouslySetInnerHTML/g, "dangerouslySetInnerHTML não é permitido sem revisão explícita"],
    [/@ts-ignore/g, "@ts-ignore não é permitido; corrija o tipo"],
    [/\beval\s*\(/g, "eval() não é permitido"],
    [/new\s+Function\s*\(/g, "new Function() não é permitido"],
    [/\b(?:sk-proj-|sk-|sb_secret_)[A-Za-z0-9_-]{16,}/g, "possível segredo/API key versionado no código"],
    [/\bservice[_-]?role\b/gi, "referência a service_role em código da aplicação"],
    [/\.auth\.getSession\s*\(/g, "não use getSession() para autorização no servidor; use claims/user verificado"],
  ];

  for (const [regex, message] of forbidden) {
    for (const match of executableSource.matchAll(regex)) report(file, executableSource, match.index ?? 0, message);
  }

  for (const match of source.matchAll(/<a\b([^>]*)target\s*=\s*["']_blank["']([^>]*)>/gs)) {
    const attrs = (match[1] ?? "") + (match[2] ?? "");
    if (!/rel\s*=\s*["'][^"']*(?:noopener|noreferrer)/.test(attrs)) {
      report(file, source, match.index ?? 0, "link target=_blank sem rel=noopener/noreferrer");
    }
  }

  if (/\/actions\.(ts|js)$/.test(file.split(path.sep).join("/")) && !/^["']use server["'];/.test(source.trimStart())) {
    report(file, source, 0, "arquivo de Server Actions sem diretiva use server");
  }

  if (/^app[\\/]api[\\/]/.test(file) && /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(source)) {
    const hasAuthCheck = /\b(getCurrentAccount|requireAccount)\s*\(/.test(source);
    if (!hasAuthCheck) report(file, source, 0, "rota mutável de API sem verificação de conta");
  }
}

if (errors.length) {
  console.error("\nSIFCAS quality/security audit failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`SIFCAS quality/security audit passed: ${files.length} source files checked.`);
