import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components"];
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(full);
  }
}

roots.forEach(walk);
const errors = [];

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function report(file, source, index, message) {
  errors.push(\`\${file}:\${lineNumber(source, index)} — \${message}\`);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");

  for (const match of source.matchAll(/<button\b([^>]*)>/gs)) {
    const attrs = match[1] ?? "";
    const isSubmit = /\btype\s*=\s*["']submit["']/.test(attrs);
    const hasHandler = /\bonClick\s*=|\bformAction\s*=/.test(attrs);
    if (!isSubmit && !hasHandler) report(file, source, match.index ?? 0, "button sem ação (use submit, onClick ou formAction)");
  }

  for (const match of source.matchAll(/<form\b([^>]*)>/gs)) {
    const attrs = match[1] ?? "";
    const hasAction = /\baction\s*=/.test(attrs);
    const isGet = /\bmethod\s*=\s*["']get["']/.test(attrs);
    const hasSubmitHandler = /\bonSubmit\s*=/.test(attrs);
    if (!hasAction && !isGet && !hasSubmitHandler) report(file, source, match.index ?? 0, "formulário sem action, onSubmit ou método GET");
  }

  for (const match of source.matchAll(/<Link\b([^>]*)>/gs)) {
    const attrs = match[1] ?? "";
    if (!/\bhref\s*=/.test(attrs)) report(file, source, match.index ?? 0, "Link sem href");
  }

  for (const match of source.matchAll(/<a\b([^>]*)>/gs)) {
    const attrs = match[1] ?? "";
    if (!/\bhref\s*=/.test(attrs)) report(file, source, match.index ?? 0, "âncora sem href");
  }
}

if (errors.length) {
  console.error("\nSIFCAS UI interaction audit failed:\n");
  errors.forEach((error) => console.error(\`- \${error}\`));
  process.exit(1);
}

console.log(\`SIFCAS UI interaction audit passed: \${files.length} TSX/JSX files checked.\`);
