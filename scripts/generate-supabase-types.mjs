import { renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRef = "xqhilujzacwebeexljaf";
if (process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_PROJECT_REF !== projectRef) {
  throw new Error(`Projeto recusado. Esperado: ${projectRef}.`);
}

const executable = process.platform === "win32" ? "supabase.cmd" : "supabase";
const result = spawnSync(executable, ["gen", "types", "typescript", "--project-id", projectRef, "--schema", "public"], { encoding: "utf8" });
if (result.error?.code === "ENOENT") throw new Error("Supabase CLI não encontrado. Execute npm ci antes.");
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  throw new Error("A geração de tipos falhou; o arquivo atual foi preservado.");
}
if (!result.stdout.includes("export type Json") || !result.stdout.includes("export type Database")) {
  throw new Error("A saída não parece conter tipos válidos do Supabase; o arquivo atual foi preservado.");
}

const target = resolve("lib/database.types.ts");
const temporary = `${target}.tmp`;
writeFileSync(temporary, result.stdout, "utf8");
renameSync(temporary, target);
console.log(`Tipos do projeto ${projectRef} gravados em lib/database.types.ts.`);
