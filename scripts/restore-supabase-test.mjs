import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { postgresEnvironment } from "./postgres-env.mjs";

const projectRef = "xqhilujzacwebeexljaf";
const archive = process.argv[2] ? resolve(process.argv[2]) : "";
const rawUrl = process.env.SIFCAS_RESTORE_TEST_DB_URL;

if (!archive || !existsSync(archive)) throw new Error("Informe um arquivo .dump existente: npm run db:restore-test -- backups/arquivo.dump");
if (!rawUrl) throw new Error("Defina SIFCAS_RESTORE_TEST_DB_URL para um banco vazio e descartável.");
if (process.env.SIFCAS_CONFIRM_RESTORE_TEST !== "RESTORE_SIFCAS_TEST_ONLY") {
  throw new Error("Defina SIFCAS_CONFIRM_RESTORE_TEST=RESTORE_SIFCAS_TEST_ONLY para confirmar o ambiente descartável.");
}

const target = new URL(rawUrl);
if (target.hostname.includes(projectRef) || decodeURIComponent(target.username).includes(projectRef) || rawUrl.includes(projectRef)) {
  throw new Error("Restauração recusada: o destino aponta para o projeto de produção do SIFCAS.");
}

const restore = spawnSync("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", archive], {
  env: postgresEnvironment(rawUrl),
  stdio: "inherit",
});
if (restore.error?.code === "ENOENT") throw new Error("pg_restore não foi encontrado no PATH.");
if (restore.status !== 0) throw new Error(`O ensaio de restauração terminou com código ${restore.status ?? "desconhecido"}.`);
console.log("Ensaio de restauração concluído no banco descartável informado.");
