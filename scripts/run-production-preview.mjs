import { spawn, execFileSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { startSyntheticSupabase } from "../tests/fixtures/synthetic-supabase.mjs";

if (process.env.NODE_ENV === "production") throw new Error("Execute esta ferramenta local fora de um processo de produção.");
process.env.SIFCAS_SYNTHETIC_FIXTURE = "1";
const fixture = await startSyntheticSupabase();
const environment = { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fixture.publishableKey, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3102", SIFCAS_TEST_DIST_DIR: "", SIFCAS_ALLOW_PRODUCTION_SUPABASE_IN_DEV: "false", SIFCAS_ACADEMIC_IMPORT_ENABLED: "true", SIFCAS_PERSONAL_CALENDAR_ENABLED: "true" };
let child, closed = false;
async function close() {
  if (closed) return;
  closed = true;
  if (child?.pid && child.exitCode === null) {
    try {
      if (process.platform === "win32") execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
      else child.kill("SIGTERM");
    } catch { /* The child may already have exited. */ }
  }
  await fixture.close();
}
process.once("SIGINT", () => close().finally(() => process.exit(130)));
process.once("SIGTERM", () => close().finally(() => process.exit(143)));
try {
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], { env: environment, stdio: "inherit", windowsHide: true });
  const buildCode = await new Promise((resolve) => child.once("exit", resolve));
  if (buildCode !== 0) throw new Error(`Build local falhou: ${buildCode}`);
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3102"], { env: environment, stdio: "inherit", windowsHide: true });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (child.exitCode !== null) throw new Error("Preview local encerrou antes de iniciar.");
    try { if ((await fetch("http://127.0.0.1:3102/noticias", { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch { /* Wait until Next is ready. */ }
    await setTimeout(1000);
  }
  if (!ready) throw new Error("Preview local indisponível.");
  console.log("BUILD DE PRODUÇÃO LOCAL: http://127.0.0.1:3102; banco sintético em memória; nenhum serviço institucional conectado.");
  await new Promise((resolve) => child.once("exit", resolve));
} finally { await close(); }
