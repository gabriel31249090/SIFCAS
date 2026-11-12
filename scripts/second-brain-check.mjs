import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { catalog, freshness, loadManifest, noteId, validateLinks } from "./second-brain-generate.mjs";

try {
  const manifest = loadManifest();
  const state = freshness(manifest);
  const links = validateLinks();
  const missing = manifest.files.filter((entry) => !existsSync(path.join(catalog, "Arquivos", `${noteId(entry.path)}.md`))).map((entry) => entry.path);
  const mismatched = manifest.files.filter((entry) => {
    const filename = path.join(catalog, "Arquivos", `${noteId(entry.path)}.md`);
    return existsSync(filename) && !readFileSync(filename, "utf8").replace(/\r\n?/g, "\n").includes(`sha256: ${entry.hash}\n`);
  }).map((entry) => entry.path);
  const stale = state.added.length + state.changed.length + state.removed.length > 0;
  console.log(`Memória ${stale ? "DESATUALIZADA" : "atual"}: ${manifest.files.length} fontes, ${links.notes} notas, base ${manifest.head.slice(0, 12)}, gerada ${manifest.generatedAt}.`);
  for (const [label, values] of Object.entries({ novos: state.added, alterados: state.changed, removidos: state.removed, fichas_ausentes: missing, fichas_divergentes: mismatched, links_quebrados: links.broken })) {
    if (values.length) console.log(`${label}: ${values.length}\n${values.slice(0, 12).map((value) => `  ${value}`).join("\n")}${values.length > 12 ? "\n  … saída limitada a 12 itens" : ""}`);
  }
  if (state.headChanged) console.log("HEAD difere da proveniência do snapshot; isso não invalida hashes de fontes idênticas.");
  if (stale) console.log("Regenerar após revisar as notas humanas: node scripts/second-brain-generate.mjs");
  if (stale || missing.length || mismatched.length || links.broken.length) process.exitCode = 1;
} catch (error) {
  console.error(`Falha ao verificar memória: ${error.message}. Gere o catálogo com node scripts/second-brain-generate.mjs.`);
  process.exitCode = 1;
}
