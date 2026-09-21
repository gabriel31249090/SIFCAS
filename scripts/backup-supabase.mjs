import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { postgresEnvironment } from "./postgres-env.mjs";

const rawUrl = process.env.SUPABASE_DB_URL;
if (!rawUrl) throw new Error("Defina SUPABASE_DB_URL com a conexão direta do banco antes do backup.");

const outputDirectory = resolve(process.argv[2] || "backups");
mkdirSync(outputDirectory, { recursive: true });
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const target = resolve(outputDirectory, `sifcas-${timestamp}.dump`);
const env = postgresEnvironment(rawUrl);

const dump = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", target], { env, stdio: "inherit" });
if (dump.error?.code === "ENOENT") throw new Error("pg_dump não foi encontrado no PATH.");
if (dump.status !== 0) throw new Error(`pg_dump terminou com código ${dump.status ?? "desconhecido"}.`);

const integrity = spawnSync("pg_restore", ["--list", target], { encoding: "utf8" });
if (integrity.error?.code === "ENOENT") throw new Error("pg_restore não foi encontrado no PATH; o arquivo foi criado, mas não pôde ser verificado.");
if (integrity.status !== 0 || !integrity.stdout.trim()) throw new Error("O arquivo foi criado, mas falhou na verificação de integridade.");

const digest = createHash("sha256").update(readFileSync(target)).digest("hex");
writeFileSync(`${target}.sha256`, `${digest}  ${basename(target)}\n`, "utf8");
console.log(`Backup lógico criado e verificado: ${target}`);
console.log(`SHA-256: ${digest}`);
console.log("Mantenha uma cópia criptografada fora do Supabase e faça backup do Storage separadamente.");
