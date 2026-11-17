import { readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRegistry, detectStack, profiles } from "./adapters.mjs";
import { runCommand, runPipeline, memoryRepair, writeReport, validateOptions, redact } from "./engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const help = `Manutenção SIFCAS (Node.js 24)
Uso: npm run maintain -- [opções]
  --mode audit_only|dry_run|safe|full
  --profile quick|complete        full usa complete se não informado
  --only id,id                    Selecionar adapters registrados
  --environment dev|test|staging|prod
  --fix memory-catalog            Única correção registrada; exige safe/full
  --network                      Permitir consulta npm audit
  --timeout-ms 180000             Limite por comando (complete: 900000)
  --retries 0                    Apenas adapters marcados retryable (0..3)
  --max-cycles 2                 Limite (1..3); novo ciclo só após correção
  --stop-on-error                 Interromper checagens após falha
  --help
Adapters: ${profiles.complete.join(", ")}
Saídas: 0 aprovado/plano; 1 aviso/indisponível; 2 falha; 3 configuração.
Relatórios: reports/maintenance/<execução>/report.{json,md}
Sem SQL remoto, deploy, atualização de dependências ou commit/push automático.`;

export function parseArgs(args, defaults) {
  const options = { ...defaults, fix: null };
  let explicitProfile = false;
  const fields = { "--mode": "mode", "--profile": "profile", "--environment": "environment", "--fix": "fix", "--timeout-ms": "timeoutMs", "--retries": "retries", "--max-cycles": "maxCycles", "--only": "only" };
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === "--network") { options.network = true; continue; }
    if (flag === "--stop-on-error") { options.stopOnError = true; continue; }
    const key = Object.hasOwn(fields, flag) ? fields[flag] : null;
    if (!key || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Opção inválida ou sem valor: ${flag}`);
    const value = args[++index];
    options[key] = ["timeoutMs", "retries", "maxCycles"].includes(key) ? Number(value) : key === "only" ? value.split(",") : value;
    if (key === "profile") explicitProfile = true;
  }
  if (options.mode === "full" && !explicitProfile) options.profile = "complete";
  if (!Object.hasOwn(profiles, options.profile)) throw new Error(`Perfil desconhecido: ${options.profile}`);
  if (options.profile === "complete" && !args.includes("--timeout-ms")) options.timeoutMs = 900000;
  options.only ??= [...profiles[options.profile]];
  if (options.fix) options.only = [...new Set([...options.only, "memory", "unit"])];
  return options;
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === "--help") { console.log(help); return 0; }
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try {
    const defaults = JSON.parse(await readFile(new URL("./config.json", import.meta.url), "utf8"));
    const options = parseArgs(args, defaults);
    const execute = (command, argv, overrides = {}) => runCommand(command, argv, { cwd: root, timeoutMs: options.timeoutMs, signal: controller.signal, ...overrides });
    const registry = createRegistry({ root, execute });
    validateOptions(options, registry.map(({ id }) => id));
    const stack = detectStack(root);
    const directory = path.join(root, "reports/maintenance", `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`);
    await mkdir(directory, { recursive: true });
    const report = await runPipeline({ registry, options, stack, signal: controller.signal, repair: memoryRepair({ root, reportDir: directory, execute }), progress: (id) => console.log(`[${options.mode}] ${id}`) });
    await writeReport(report, directory);
    for (const result of report.cycles.at(-1).results) console.log(`${result.status.padEnd(11)} ${result.id}: ${result.summary}`);
    for (const result of report.corrections) console.log(`${result.status.padEnd(11)} ${result.id}: ${result.summary}`);
    console.log(`Relatório: ${path.relative(root, directory)}/report.md`);
    console.log(`Saída ${report.summary.exitCode}; ${report.summary.changedActions} ações alteraram arquivos.`);
    return report.summary.exitCode;
  } catch (error) {
    console.error(`Manutenção interrompida: ${redact(error.message)}`);
    return 3;
  } finally {
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main();
