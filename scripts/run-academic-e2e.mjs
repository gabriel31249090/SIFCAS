import { spawn, execFileSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { startSyntheticSupabase } from "../tests/fixtures/synthetic-supabase.mjs";

process.env.SIFCAS_SYNTHETIC_FIXTURE = "1";
const fixture = await startSyntheticSupabase();
const environment = { ...process.env, NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fixture.publishableKey, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100", SIFCAS_TEST_DIST_DIR: ".next-academic", SIFCAS_ACADEMIC_IMPORT_ENABLED: "true", SIFCAS_PERSONAL_CALENDAR_ENABLED: "true" };
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3100"], { env: environment, stdio: "inherit", windowsHide: true });
let closed = false;
async function close() {
  if (closed) return; closed = true;
  if (app.pid) { try { if (process.platform === "win32") execFileSync("taskkill", ["/pid", String(app.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true }); else app.kill("SIGTERM"); } catch {} }
  await fixture.close();
}
process.once("SIGINT", () => close().finally(() => process.exit(130)));
process.once("SIGTERM", () => close().finally(() => process.exit(143)));
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (app.exitCode !== null) throw new Error("Servidor de teste encerrou antes de iniciar.");
    try { const response = await fetch("http://127.0.0.1:3100/login", { signal: AbortSignal.timeout(1500) }); if (response.ok) { ready = true; break; } } catch {}
    await setTimeout(1000);
  }
  if (!ready) throw new Error("Servidor isolado não ficou disponível.");
  console.log("SIFCAS: cenário SINTÉTICO local em http://127.0.0.1:3100; sem dados ou credenciais institucionais.");
  console.log("Escolha uma sessão de demonstração: http://127.0.0.1:54331/");
  if (process.argv.includes("--serve")) await new Promise((resolve) => app.once("exit", resolve));
  else {
    const test = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.academic.config.ts"], { env: environment, stdio: "inherit", windowsHide: true });
    const code = await new Promise((resolve) => test.once("exit", resolve)); process.exitCode = code ?? 1;
  }
} finally { await close(); }
