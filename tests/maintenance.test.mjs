import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogFiles, memoryRepair, redact, runCommand, runPipeline, validateOptions, writeReport } from "../tools/maintenance/engine.mjs";
import { parseArgs } from "../tools/maintenance/cli.mjs";
import { createRegistry } from "../tools/maintenance/adapters.mjs";

// Node's test runner gives this file its own process. Keep pure engine scenarios
// isolated from a CI/Vercel build environment; production guards are tested below
// in separate CLI processes with those real environment variables restored.
const previousRuntime = { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL };
process.env.NODE_ENV = "test";
delete process.env.VERCEL;
after(() => {
  for (const [key, value] of Object.entries(previousRuntime)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const options = (overrides = {}) => ({ mode: "audit_only", environment: "test", profile: "quick", timeoutMs: 5000, retries: 0, maxCycles: 2, network: false, stopOnError: false, only: ["unit"], fix: null, ...overrides });
const adapter = (id, run, extra = {}) => ({ id, category: "test", description: `Check ${id}`, run, ...extra });
const passed = () => ({ status: "passed", summary: "Real check completed." });

async function temporary(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sifcas-maintenance-test-"));
  t.after(async () => {
    const target = path.resolve(directory);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.match(path.basename(target), /^sifcas-maintenance-test-/);
    await rm(target, { recursive: true, force: true });
  });
  return directory;
}

test("maintenance runs argv literally without shell interpolation", async (t) => {
  const cwd = await temporary(t);
  const values = ["space and 'quotes'", "$(echo unsafe)", "`echo unsafe`", "& echo unsafe > marker.txt", "a; echo unsafe", "é/ação"];
  const result = await runCommand(process.execPath, ["-e", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", ...values], { cwd, timeoutMs: 5000 });
  assert.equal(result.status, "passed");
  assert.equal(result.code, 0);
  assert.deepEqual(JSON.parse(result.output), values);
  await assert.rejects(readFile(path.join(cwd, "marker.txt")), { code: "ENOENT" });
});

test("maintenance preserves nonzero exit and redacts captured synthetic secrets", async () => {
  const secret = "synthetic-maintenance-value-12345";
  const result = await runCommand(process.execPath, ["-e", "console.error(process.env.SIFCAS_TEST_SECRET); process.exit(7)"], { env: { ...process.env, SIFCAS_TEST_SECRET: secret }, timeoutMs: 5000 });
  assert.equal(result.status, "failed");
  assert.equal(result.code, 7);
  assert.equal(result.output.includes(secret), false);
  assert.match(result.output, /REDACTED/);
});

test("maintenance reports an unavailable executable as a spawn failure", async (t) => {
  const cwd = await temporary(t);
  const result = await runCommand(path.join(cwd, "not-an-executable"), [], { cwd, timeoutMs: 5000 });
  assert.equal(result.status, "failed");
  assert.equal(result.code, null);
  assert.equal(result.reason, "spawn-error");
});

test("maintenance terminates a hanging process at its timeout", { timeout: 10000 }, async () => {
  const result = await runCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeoutMs: 250 });
  assert.equal(result.status, "failed");
  assert.equal(result.reason, "timeout");
  assert.ok(result.durationMs < 8000);
});

test("maintenance handles both prior cancellation and cancellation during execution", { timeout: 10000 }, async () => {
  const before = new AbortController();
  before.abort();
  const skipped = await runCommand("not-launched", [], { signal: before.signal });
  assert.equal(skipped.reason, "aborted");
  assert.equal(skipped.durationMs, 0);

  const during = new AbortController();
  const timer = setTimeout(() => during.abort(), 250);
  try {
    const result = await runCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { signal: during.signal, timeoutMs: 5000 });
    assert.equal(result.status, "failed");
    assert.equal(result.reason, "aborted");
  } finally { clearTimeout(timer); }
});

test("dry run plans checks and repair without invoking either", async () => {
  const forbidden = () => { throw new Error("dry run executed an action"); };
  const registry = [adapter("memory", forbidden), adapter("unit", forbidden)];
  const report = await runPipeline({ registry, options: options({ mode: "dry_run", only: ["memory", "unit"], fix: "memory-catalog" }), repair: { prepare: forbidden, apply: forbidden, rollback: forbidden } });
  assert.deepEqual(report.cycles[0].results.map(({ status, attempts }) => ({ status, attempts })), [{ status: "planned", attempts: 0 }, { status: "planned", attempts: 0 }]);
  assert.equal(report.corrections[0].status, "planned");
  assert.equal(report.summary.exitCode, 0);
  assert.equal(report.summary.converged, false);
  assert.equal(report.summary.changedActions, 0);
});

test("unavailable checks are not success or convergence, and failures have precedence", async () => {
  const unavailable = adapter("remote", async () => ({ status: "unavailable", summary: "No authorized remote connection." }));
  const warning = await runPipeline({ registry: [unavailable], options: options({ only: ["remote"] }) });
  assert.equal(warning.summary.exitCode, 1);
  assert.equal(warning.summary.converged, false);
  const failure = await runPipeline({ registry: [unavailable, adapter("unit", async () => { throw new Error("actual failure"); })], options: options({ only: ["remote", "unit"] }) });
  assert.equal(failure.summary.exitCode, 2);
  assert.equal(failure.summary.counts.unavailable, 1);
  assert.equal(failure.summary.counts.failed, 1);
});

test("stop-on-error records later checks as unexecuted and never calls them", async () => {
  let calls = 0;
  const report = await runPipeline({ registry: [adapter("first", async () => ({ status: "failed", summary: "Failed baseline." })), adapter("later", async () => { calls++; return passed(); })], options: options({ only: ["first", "later"], stopOnError: true }) });
  assert.equal(calls, 0);
  assert.equal(report.cycles[0].results[1].status, "unavailable");
  assert.equal(report.cycles[0].results[1].attempts, 0);
  assert.equal(report.summary.exitCode, 2);
});

test("cancellation of a running pipeline cannot report success or convergence", async () => {
  const controller = new AbortController();
  let laterCalls = 0;
  const report = await runPipeline({ registry: [adapter("first", async () => { controller.abort(); return passed(); }), adapter("later", async () => { laterCalls++; return passed(); })], signal: controller.signal, options: options({ only: ["first", "later"] }) });
  assert.equal(laterCalls, 0);
  assert.equal(report.summary.exitCode, 2);
  assert.equal(report.summary.converged, false);
});

test("only explicitly retryable adapters retry, within the configured bound", async () => {
  let transient = 0, permanent = 0;
  const report = await runPipeline({ registry: [adapter("transient", async () => ({ status: ++transient < 3 ? "failed" : "passed", summary: "Measured attempt." }), { retryable: true }), adapter("permanent", async () => { permanent++; return { status: "failed", summary: "Deterministic error." }; })], options: options({ only: ["transient", "permanent"], retries: 2 }) });
  assert.equal(transient, 3);
  assert.equal(permanent, 1);
  assert.deepEqual(report.cycles[0].results.map(({ attempts }) => attempts), [3, 1]);
  assert.equal(report.summary.exitCode, 2);
});

test("safe repair requires a passing baseline and validates actual results afterward", async () => {
  let memoryCalls = 0, unitCalls = 0, prepared = 0, applied = 0;
  const registry = [adapter("memory", async () => ({ status: ++memoryCalls === 1 ? "failed" : "passed", summary: "Hash check." })), adapter("unit", async () => { unitCalls++; return passed(); })];
  const report = await runPipeline({ registry, options: options({ mode: "safe", only: ["memory", "unit"], fix: "memory-catalog" }), repair: { prepare: async () => { prepared++; return { original: true }; }, apply: async () => { applied++; return passed(); }, rollback: async () => { throw new Error("Unexpected rollback"); } } });
  assert.equal(prepared, 1);
  assert.equal(applied, 1);
  assert.equal(memoryCalls, 2);
  assert.equal(unitCalls, 2);
  assert.equal(report.cycles.length, 2);
  assert.equal(report.cycles[0].results[0].status, "failed");
  assert.equal(report.cycles[1].results[0].status, "passed");
  assert.equal(report.summary.exitCode, 0);
  assert.equal(report.summary.changedActions, 1);
  assert.equal(report.summary.converged, true);
});

test("safe repair is not started after a failed unit baseline", async () => {
  let prepared = false;
  const report = await runPipeline({ registry: [adapter("memory", async () => ({ status: "failed" })), adapter("unit", async () => ({ status: "failed" }))], options: options({ mode: "safe", only: ["memory", "unit"], fix: "memory-catalog" }), repair: { prepare: async () => { prepared = true; } } });
  assert.equal(prepared, false);
  assert.equal(report.corrections[0].status, "unavailable");
  assert.equal(report.summary.changedActions, 0);
  assert.equal(report.summary.exitCode, 2);
});

test("failed post-repair validation restores the exact checkpoint and is not counted as corrected", async () => {
  const snapshot = { original: "bytes" };
  let restored, applied = false, memoryCalls = 0;
  const report = await runPipeline({ registry: [adapter("memory", async () => { memoryCalls++; return { status: "failed", summary: "Still stale." }; }), adapter("unit", async () => passed())], options: options({ mode: "safe", only: ["memory", "unit"], fix: "memory-catalog" }), repair: { prepare: async () => snapshot, apply: async () => { applied = true; return passed(); }, rollback: async (value) => { restored = value; } } });
  assert.equal(applied, true);
  assert.equal(memoryCalls, 2);
  assert.equal(restored, snapshot);
  assert.equal(report.corrections[0].rollback, "restored");
  assert.equal(report.summary.changedActions, 0);
  assert.equal(report.summary.exitCode, 2);
});

test("failed rollback remains a failure in the report", async () => {
  const report = await runPipeline({ registry: [adapter("memory", async () => ({ status: "failed" })), adapter("unit", async () => passed())], options: options({ mode: "safe", only: ["memory", "unit"], fix: "memory-catalog" }), repair: { prepare: async () => ({}), apply: async () => ({ status: "failed", summary: "Generator failed." }), rollback: async () => { throw new Error("Disk unavailable"); } } });
  assert.equal(report.corrections[0].rollback, "failed");
  assert.equal(report.summary.exitCode, 2);
  assert.equal(report.summary.converged, false);
});

test("CLI rejects unsupported flags, identifiers and mutation combinations", () => {
  const defaults = options();
  delete defaults.only;
  assert.throws(() => parseArgs(["--command", "echo unsafe"], defaults), /Opção inválida/);
  assert.throws(() => parseArgs(["toString", "ignored"], defaults), /Opção inválida/);
  assert.throws(() => parseArgs(["--profile", "toString"], defaults), /Perfil desconhecido/);
  assert.throws(() => parseArgs(["--mode"], defaults), /sem valor/);
  assert.throws(() => validateOptions(parseArgs(["--only", "unit;echo unsafe"], defaults), ["unit"]), /desconhecido/);
  assert.throws(() => validateOptions(options({ only: ["unit", "unit"] }), ["unit"]), /repetidas/);
  assert.throws(() => validateOptions(options({ timeoutMs: NaN }), ["unit"]), /timeoutMs/);
  assert.throws(() => validateOptions(options({ mode: "safe", fix: "database-drop" }), ["unit"]), /não registrada/);
  assert.throws(() => validateOptions(options({ environment: "prod" }), ["unit"]), /fora de produção/);
  const full = parseArgs(["--mode", "full"], defaults);
  assert.equal(full.profile, "complete");
  const fixing = parseArgs(["--mode", "safe", "--only", "assets", "--fix", "memory-catalog"], defaults);
  assert.deepEqual(fixing.only, ["assets", "memory", "unit"]);
});

test("real CLI refuses Vercel and production runtime before executing checks", async () => {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const environment of [{ VERCEL: "1" }, { NODE_ENV: "production" }]) {
    const result = await runCommand(process.execPath, ["tools/maintenance/cli.mjs", "--only", "security"], { cwd, env: { ...process.env, ...environment }, timeoutMs: 5000 });
    assert.equal(result.code, 3);
    assert.equal(result.status, "failed");
    assert.match(result.output, /fora de produção/);
    assert.doesNotMatch(result.output, /\[audit_only\]|Relatório:/);
  }
});

async function fakeCatalog(t) {
  const root = await temporary(t);
  const catalog = path.join(root, "docs/second-brain/20-Catalogo");
  await mkdir(path.join(catalog, "Arquivos"), { recursive: true });
  await writeFile(path.join(catalog, "manifest.json"), '{"version":1}\n');
  await writeFile(path.join(catalog, "Arquivos/original.md"), "original bytes\r\n");
  const human = path.join(root, "docs/second-brain/01-Estado-atual.md");
  await writeFile(human, "human notes remain untouched");
  const reportDir = path.join(root, "reports");
  const execute = async (command, argv) => command === "git" ? { status: "passed", output: argv[0] === "branch" ? "codex/test\n" : "" } : passed();
  return { root, catalog, human, reportDir, execute };
}

test("catalog checkpoint restores changed/deleted files, removes only generated additions and preserves human notes", async (t) => {
  const fixture = await fakeCatalog(t);
  const repair = memoryRepair(fixture);
  const snapshot = await repair.prepare();
  assert.equal(JSON.parse(await readFile(path.join(fixture.reportDir, "catalog-checkpoint.json"), "utf8"))[path.join("Arquivos", "original.md")], Buffer.from("original bytes\r\n").toString("base64"));
  await writeFile(path.join(fixture.catalog, "manifest.json"), "changed");
  await rm(path.join(fixture.catalog, "Arquivos/original.md"));
  await writeFile(path.join(fixture.catalog, "Arquivos/new.md"), "generated");
  await repair.rollback(snapshot);
  assert.equal(await readFile(path.join(fixture.catalog, "Arquivos/original.md"), "utf8"), "original bytes\r\n");
  assert.equal(await readFile(path.join(fixture.catalog, "manifest.json"), "utf8"), '{"version":1}\n');
  await assert.rejects(readFile(path.join(fixture.catalog, "Arquivos/new.md")), { code: "ENOENT" });
  assert.equal(await readFile(fixture.human, "utf8"), "human notes remain untouched");
});

test("catalog correction refuses protected branch and pre-existing local catalog changes", async (t) => {
  const fixture = await fakeCatalog(t);
  const protectedRepair = memoryRepair({ ...fixture, execute: async () => ({ status: "passed", output: "main\n" }) });
  await assert.rejects(protectedRepair.prepare(), /branch de trabalho/);
  const dirtyRepair = memoryRepair({ ...fixture, execute: async (_command, argv) => ({ status: "passed", output: argv[0] === "branch" ? "codex/test\n" : " M docs/second-brain/20-Catalogo/manifest.json\n" }) });
  await assert.rejects(dirtyRepair.prepare(), /alterações locais/);
  assert.equal(await readFile(fixture.human, "utf8"), "human notes remain untouched");
});

test("catalog checkpoint refuses a symbolic link instead of traversing it", async (t) => {
  const fixture = await fakeCatalog(t);
  const outside = path.join(fixture.root, "outside");
  await mkdir(outside);
  await writeFile(path.join(outside, "private.md"), "synthetic data outside catalog");
  try { await symlink(outside, path.join(fixture.catalog, "linked"), process.platform === "win32" ? "junction" : "dir"); }
  catch (error) { if (error.code === "EPERM") return t.skip("Symbolic links unavailable on this host."); throw error; }
  await assert.rejects(catalogFiles(fixture.catalog, fixture.root), /links simbólicos/);
  assert.equal(await readFile(path.join(outside, "private.md"), "utf8"), "synthetic data outside catalog");
});

test("catalog rollback validates all checkpoint paths before changing any files", async (t) => {
  const fixture = await fakeCatalog(t);
  const repair = memoryRepair(fixture);
  const addition = path.join(fixture.catalog, "keep-until-valid.md");
  await writeFile(addition, "do not erase for an invalid checkpoint");
  await assert.rejects(repair.rollback({ "../outside.md": Buffer.from("invalid").toString("base64") }), /Checkpoint inválido/);
  assert.equal(await readFile(addition, "utf8"), "do not erase for an invalid checkpoint");
});

test("report files remain valid JSON after redacting secret-like output", async (t) => {
  const directory = await temporary(t);
  const report = await runPipeline({ registry: [adapter("unit", async () => ({ status: "failed", summary: "password=synthetic-value-123", output: "authorization: bearer synthetic-bearer-123" }))], options: options() });
  await writeReport(report, directory);
  const encoded = await readFile(path.join(directory, "report.json"), "utf8");
  const decoded = JSON.parse(encoded);
  assert.equal(decoded.cycles[0].results[0].summary.includes("synthetic-value"), false);
  assert.equal(encoded.includes("synthetic-bearer"), false);
  assert.equal(decoded.summary.exitCode, 2);
  const markdown = await readFile(path.join(directory, "report.md"), "utf8");
  assert.match(markdown, /\| unit \| failed \|/);
  assert.equal(markdown.includes("synthetic-value"), false);
  assert.equal(redact("postgres://synthetic-user:synthetic-pass@example.invalid/db").includes("synthetic-pass"), false);
});

async function browserFixture(t, original) {
  const root = await temporary(t);
  await mkdir(path.join(root, "scripts"));
  await writeFile(path.join(root, "scripts/run-academic-e2e.mjs"), "// Stubbed by the test executor.\n");
  await mkdir(path.join(root, "node_modules/@playwright/test"), { recursive: true });
  await writeFile(path.join(root, "node_modules/@playwright/test/cli.js"), "// Presence only; no subprocess is launched.\n");
  const nextEnv = path.join(root, "next-env.d.ts");
  if (original !== undefined) await writeFile(nextEnv, original);
  return { root, nextEnv };
}

const nextEnvOriginal = '/// <reference types="next" />\r\nimport "./.next/types/routes.d.ts";\r\nimport "./.next/types/root-params.d.ts";\r\n// Preserve this human comment.\r\n';
const generatedNextEnv = nextEnvOriginal.replaceAll("\r\n", "\n").replaceAll("./.next/types/", "./.next-academic/dev/types/");

test("browser adapter restores the exact original Next type imports and line endings", async (t) => {
  const fixture = await browserFixture(t, nextEnvOriginal);
  let calls = 0;
  const registry = createRegistry({ root: fixture.root, execute: async () => { calls++; await writeFile(fixture.nextEnv, generatedNextEnv); return { ...passed(), code: 0, output: "Synthetic browser checks passed." }; } });
  const result = await registry.find(({ id }) => id === "browser").run({ options: options() });
  assert.equal(calls, 1);
  assert.equal(result.status, "passed");
  assert.deepEqual(await readFile(fixture.nextEnv), Buffer.from(nextEnvOriginal));
});

test("browser adapter preserves an additional human edit and reports a failure", async (t) => {
  const fixture = await browserFixture(t, nextEnvOriginal);
  const humanEdited = generatedNextEnv + "// New user note during execution.\n";
  const registry = createRegistry({ root: fixture.root, execute: async () => { await writeFile(fixture.nextEnv, humanEdited); return { ...passed(), code: 0, output: "Browser runner completed." }; } });
  const result = await registry.find(({ id }) => id === "browser").run({ options: options() });
  assert.equal(result.status, "failed");
  assert.equal(await readFile(fixture.nextEnv, "utf8"), humanEdited);
});

test("browser adapter reports an unexpectedly created Next environment file without deleting it", async (t) => {
  const fixture = await browserFixture(t);
  const registry = createRegistry({ root: fixture.root, execute: async () => { await writeFile(fixture.nextEnv, generatedNextEnv); return { ...passed(), code: 0, output: "Runner completed." }; } });
  const result = await registry.find(({ id }) => id === "browser").run({ options: options() });
  assert.equal(result.status, "failed");
  assert.equal(await readFile(fixture.nextEnv, "utf8"), generatedNextEnv);
});

test("browser adapter reports an unexpectedly missing Next environment file", async (t) => {
  const fixture = await browserFixture(t, nextEnvOriginal);
  const registry = createRegistry({ root: fixture.root, execute: async () => { await rm(fixture.nextEnv); return { ...passed(), code: 0, output: "Runner completed." }; } });
  const result = await registry.find(({ id }) => id === "browser").run({ options: options() });
  assert.equal(result.status, "failed");
});
