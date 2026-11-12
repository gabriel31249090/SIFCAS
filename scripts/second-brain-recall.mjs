import { readFileSync } from "node:fs";
import path from "node:path";
import { freshness, loadManifest, markdownFiles, vault } from "./second-brain-generate.mjs";

const args = process.argv.slice(2);
let limit = 6;
const queryParts = [];
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--limit") {
    const value = Number(args[++index]);
    if (!Number.isInteger(value) || value < 1 || value > 20) { console.error("--limit aceita inteiro de 1 a 20."); process.exit(1); }
    limit = value;
  } else queryParts.push(args[index]);
}
const query = queryParts.join(" ").trim();
if (!query) { console.log('Uso: node scripts/second-brain-recall.mjs "RLS professor" --limit 6'); process.exit(0); }
const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const terms = [...new Set(normalize(query).split(/\s+/).filter(Boolean))];
try {
  const manifest = loadManifest();
  const state = freshness(manifest);
  const stale = state.added.length + state.changed.length + state.removed.length > 0;
  console.log(`${stale ? "ATENÇÃO: catálogo desatualizado; confira o código. " : ""}Snapshot ${manifest.generatedAt}, base ${manifest.head.slice(0, 12)}. Busca local por: ${query.slice(0, 180)}`);
  const ranked = markdownFiles().map((file) => {
    const text = readFileSync(file, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, "");
    const normalized = normalize(text);
    const relative = path.relative(vault, file).split(path.sep).join("/");
    const covered = terms.filter((term) => normalized.includes(term));
    if (!covered.length) return null;
    const title = normalize(relative + " " + (text.match(/^# .+$/m)?.[0] ?? ""));
    const humanBoost = relative.startsWith("10-Mapas/") ? 10 : relative === "01-Estado-atual.md" ? 6 : 0;
    const score = covered.length * 10 + (covered.length === terms.length ? 15 : 0) + terms.filter((term) => title.includes(term)).length * 8 + humanBoost;
    const lineScore = (line) => terms.filter((term) => normalize(line).includes(term)).length * 100 + Math.min(line.length, 300) / 30;
    const bestLine = text.split(/\r?\n/).filter((line) => line.trim()).sort((a, b) => lineScore(b) - lineScore(a))[0] ?? "";
    const cleanLine = bestLine.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
    const firstTerm = Math.min(...terms.map((term) => normalize(cleanLine).indexOf(term)).filter((index) => index >= 0));
    const start = Number.isFinite(firstTerm) ? Math.max(0, firstTerm - 60) : 0;
    return { path: relative, score, snippet: `${start ? "…" : ""}${cleanLine.slice(start, start + 260)}` };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
  console.log(ranked.length ? ranked.map((entry) => `\n${entry.path}\n${entry.snippet}`).join("\n") : "Nenhuma nota encontrada. Use termos mais amplos ou rg no código.");
  console.log("\nA memória orienta a busca; confirme fatos na fonte e na data da evidência.");
} catch (error) { console.error(`Falha na recuperação: ${error.message}`); process.exitCode = 1; }
