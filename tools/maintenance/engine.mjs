import { spawn, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, lstat, realpath, unlink } from "node:fs/promises";
import path from "node:path";

export const statuses = ["passed", "warning", "failed", "unavailable", "planned"];

export function redact(value, environment = process.env) {
  let output = String(value);
  for (const [key, secret] of Object.entries(environment)) {
    if (/(?:secret|token|password|private_key|api_key|service_role)/i.test(key) && secret?.length >= 8) output = output.replaceAll(secret, "[REDACTED]");
  }
  return output
    .replace(/\b(?:gh[pousr]_|github_pat_|sb_secret_|sk-proj-)[\w-]{12,}/g, "[REDACTED]")
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED JWT]")
    .replace(/([a-z][a-z\d+.-]*:\/\/)[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/((?:password|api_key|access_token|secret)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]");
}

/** Execute argv directly, including on Windows. Never pass command strings to a shell. */
export async function runCommand(command, args, { cwd, timeoutMs = 120000, signal, env = process.env, limit = 24000 } = {}) {
  if (signal?.aborted) return { status: "failed", code: null, reason: "aborted", output: "", durationMs: 0 };
  const start = Date.now();
  return new Promise((resolve) => {
    let child, output = "", reason = null, timer, settled = false;
    const finish = (code, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      resolve({ status: code === 0 && !reason && !error ? "passed" : "failed", code, reason: reason ?? (error ? "spawn-error" : null), output: redact(output + (error ? `\n${error.message}` : ""), env), durationMs: Date.now() - start });
    };
    const stop = (why) => {
      if (settled || reason) return;
      reason = why;
      if (process.platform === "win32") {
        execFile("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true }, () => child.kill());
      } else {
        try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
      }
    };
    const abort = () => stop("aborted");
    try {
      child = spawn(command, args, { cwd, env, shell: false, windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
      const capture = (chunk) => { output = (output + chunk.toString("utf8")).slice(-limit); };
      child.stdout.on("data", capture);
      child.stderr.on("data", capture);
      child.once("error", (error) => finish(null, error));
      child.once("close", (code) => finish(code));
      timer = setTimeout(() => stop("timeout"), timeoutMs);
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
    } catch (error) { finish(null, error); }
  });
}

export function validateOptions(options, knownIds) {
  const choices = (key, allowed) => { if (!allowed.includes(options[key])) throw new Error(`${key} inválido: ${options[key]}`); };
  choices("mode", ["audit_only", "dry_run", "safe", "full"]);
  choices("environment", ["dev", "test", "staging", "prod"]);
  for (const key of ["network", "stopOnError"]) if (typeof options[key] !== "boolean") throw new Error(`${key} deve ser booleano.`);
  for (const [key, min, max] of [["timeoutMs", 100, 1800000], ["retries", 0, 3], ["maxCycles", 1, 3]]) {
    if (!Number.isInteger(options[key]) || options[key] < min || options[key] > max) throw new Error(`${key} deve estar entre ${min} e ${max}.`);
  }
  if (!Array.isArray(options.only) || options.only.length === 0) throw new Error("Selecione ao menos uma checagem.");
  for (const id of options.only) if (!knownIds.includes(id)) throw new Error(`Adapter desconhecido: ${id}`);
  if (new Set(options.only).size !== options.only.length) throw new Error("Checagens repetidas.");
  if (options.fix && options.fix !== "memory-catalog") throw new Error("Correção não registrada.");
  if (options.fix && !["safe", "full", "dry_run"].includes(options.mode)) throw new Error("Correções exigem safe ou full; use dry_run para planejar.");
  if (options.fix && (!options.only.includes("memory") || !options.only.includes("unit"))) throw new Error("A correção exige as checagens memory e unit.");
  if (options.fix && options.maxCycles < 2) throw new Error("A correção exige dois ciclos para a validação posterior.");
  if (options.mode !== "dry_run" && (options.environment === "prod" || process.env.NODE_ENV === "production" || process.env.VERCEL === "1")) throw new Error("Execute a manutenção em checkout local/CI isolado, fora de produção.");
  if (options.fix && !["dev", "test"].includes(options.environment)) throw new Error("A correção local só é permitida em dev/test.");
}

export function summarize(results, mode) {
  const counts = Object.fromEntries(statuses.map((status) => [status, results.filter((result) => result.status === status).length]));
  const exitCode = counts.failed ? 2 : counts.warning || counts.unavailable ? 1 : 0;
  return { counts, exitCode, converged: mode !== "dry_run" && results.length > 0 && results.every((result) => result.status === "passed") };
}

async function runAdapter(adapter, context) {
  const started = Date.now();
  let result, attempts = 0;
  do {
    attempts++;
    try {
      result = await adapter.run(context);
      if (!statuses.includes(result?.status) || result.status === "planned") throw new Error("Resultado inválido do adapter.");
    } catch (error) { result = { status: "failed", summary: redact(error.message) }; }
  } while (result.status === "failed" && adapter.retryable === true && attempts <= context.options.retries && !context.signal?.aborted);
  return { id: adapter.id, category: adapter.category, ...result, attempts, durationMs: Date.now() - started };
}

/** Registry + pipeline. A new cycle only runs after an actual correction. */
export async function runPipeline({ registry, options, stack, repair, signal, progress = () => {} }) {
  validateOptions(options, registry.map((adapter) => adapter.id));
  const selected = options.only.map((id) => registry.find((adapter) => adapter.id === id));
  const report = { schemaVersion: 1, id: randomUUID(), startedAt: new Date().toISOString(), options, stack, plan: selected.map(({ id, category, description }) => ({ id, category, description })), cycles: [], corrections: [] };
  const context = { options, signal };
  let results = [];
  for (const adapter of selected) {
    progress(adapter.id);
    if (options.mode === "dry_run") results.push({ id: adapter.id, category: adapter.category, status: "planned", summary: adapter.description, attempts: 0 });
    else if (signal?.aborted || (options.stopOnError && results.some((result) => result.status === "failed"))) results.push({ id: adapter.id, category: adapter.category, status: "unavailable", summary: "Não executado: pipeline interrompido.", attempts: 0 });
    else results.push(await runAdapter(adapter, context));
  }
  report.cycles.push({ number: 1, results });
  if (options.fix) {
    if (options.mode === "dry_run") report.corrections.push({ id: options.fix, status: "planned", summary: "Checkpoint do catálogo, geração e validação; rollback se falhar." });
    else if (results.find((result) => result.id === "memory")?.status === "passed") report.corrections.push({ id: options.fix, status: "passed", summary: "Catálogo atual; nenhuma alteração necessária.", changed: false });
    else if (signal?.aborted || results.some((result) => result.status === "failed" && result.id !== "memory") || results.find((result) => result.id === "unit")?.status !== "passed") report.corrections.push({ id: options.fix, status: "unavailable", summary: "Baseline falhou ou foi interrompida; correção não iniciada." });
    else {
      let checkpoint;
      try {
        if (!repair) throw new Error("Adapter de correção não disponível.");
        checkpoint = await repair.prepare();
        const applied = await repair.apply(context);
        report.repairExecution = applied;
        if (applied.status !== "passed") throw new Error(applied.summary || "Geração falhou.");
        const validation = [];
        for (const id of ["memory", "unit"]) validation.push(await runAdapter(registry.find((adapter) => adapter.id === id), context));
        results = results.map((result) => validation.find((item) => item.id === result.id) ?? result);
        report.cycles.push({ number: 2, scope: "after-correction-before-any-rollback", results });
        if (validation.some((result) => result.status !== "passed")) throw new Error("Validação posterior falhou; catálogo será restaurado.");
        report.corrections.push({ id: options.fix, status: "passed", changed: true, summary: "Catálogo regenerado e validado; checkpoint preservado." });
      } catch (error) {
        let rollback = "not-needed";
        if (checkpoint) {
          try { await repair.rollback(checkpoint); rollback = "restored"; }
          catch { rollback = "failed"; }
        }
        report.corrections.push({ id: options.fix, status: "failed", summary: redact(error.message), rollback });
      }
    }
  }
  report.finishedAt = new Date().toISOString();
  report.summary = summarize([...results, ...report.corrections.filter((result) => result.status !== "passed" && result.status !== "planned")], options.mode);
  report.summary.checkCount = results.length;
  report.summary.changedActions = report.corrections.filter((result) => result.changed === true).length;
  report.interrupted = signal?.aborted === true;
  if (report.interrupted) { report.summary.exitCode = 2; report.summary.converged = false; }
  // These are operational counters, never invented defect or test counts.
  return report;
}

export async function catalogFiles(directory, root) {
  const resolved = await realpath(directory);
  const base = await realpath(root);
  if (!resolved.startsWith(`${base}${path.sep}`)) throw new Error("Catálogo fora do checkout.");
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if ((await lstat(full)).isSymbolicLink()) throw new Error("Checkpoint não aceita links simbólicos.");
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name === "manifest.json")) files.push(full);
      else throw new Error("Arquivo fora do contrato do catálogo.");
    }
  }
  await walk(resolved);
  return files;
}

export function memoryRepair({ root, reportDir, execute }) {
  const catalog = path.join(root, "docs/second-brain/20-Catalogo");
  return {
    async prepare() {
      const branch = await execute("git", ["branch", "--show-current"]);
      if (branch.status !== "passed" || !branch.output.trim() || /^(main|master|production|prod)$/i.test(branch.output.trim())) throw new Error("Correção exige uma branch de trabalho.");
      const status = await execute("git", ["status", "--porcelain", "--untracked-files=all", "--", "docs/second-brain/20-Catalogo"]);
      if (status.status !== "passed" || status.output.trim()) throw new Error("Catálogo contém alterações locais; preserve/revise antes da correção.");
      const snapshot = {};
      for (const file of await catalogFiles(catalog, root)) snapshot[path.relative(catalog, file)] = (await readFile(file)).toString("base64");
      await mkdir(reportDir, { recursive: true });
      await writeFile(path.join(reportDir, "catalog-checkpoint.json"), JSON.stringify(snapshot), { mode: 0o600 });
      return snapshot;
    },
    async apply() {
      const result = await execute(process.execPath, ["scripts/second-brain-generate.mjs"]);
      return { ...result, summary: result.status === "passed" ? "Catálogo gerado." : "Falha ao gerar catálogo." };
    },
    async rollback(snapshot) {
      // Validate the entire checkpoint before removing or writing any file.
      for (const relative of Object.keys(snapshot)) {
        const target = path.resolve(catalog, relative);
        if (!target.startsWith(`${path.resolve(catalog)}${path.sep}`) || path.isAbsolute(relative)) throw new Error("Checkpoint inválido.");
      }
      const current = await catalogFiles(catalog, root);
      for (const file of current) if (!(path.relative(catalog, file) in snapshot)) await unlink(file);
      for (const [relative, bytes] of Object.entries(snapshot)) {
        const target = path.resolve(catalog, relative);
        if (!target.startsWith(`${path.resolve(catalog)}${path.sep}`)) throw new Error("Checkpoint inválido.");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, Buffer.from(bytes, "base64"));
      }
    },
  };
}

export async function writeReport(report, directory) {
  await mkdir(directory, { recursive: true });
  const all = [...report.cycles.at(-1).results, ...report.corrections];
  const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
  const markdown = ["# Manutenção SIFCAS", "", `Execução: ${report.startedAt} · ${report.options.mode} · ${report.options.environment}`, "", `Saída: ${report.summary.exitCode}. Convergência das checagens selecionadas: ${report.summary.converged ? "sim" : "não"}.`, "", "| Checagem/ação | Estado | Resultado |", "| --- | --- | --- |", ...all.map((result) => `| ${cell(result.id)} | ${cell(result.status)} | ${cell(result.summary)} |`), "", "Os resultados descrevem o checkout e as verificações selecionadas. Não certificam produção, dados remotos ou ausência de todos os defeitos.", ""];
  await writeFile(path.join(directory, "report.json"), JSON.stringify(report, (key, value) => typeof value === "string" ? redact(value) : value, 2), { mode: 0o600 });
  await writeFile(path.join(directory, "report.md"), redact(markdown.join("\n")), { mode: 0o600 });
}
