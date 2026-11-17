import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export function detectStack(root) {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const present = (file) => existsSync(path.join(root, file));
  return {
    language: "node", node: process.version,
    framework: pkg.dependencies?.next ? `next ${pkg.dependencies.next}` : null,
    testRunner: /node .*--test/.test(pkg.scripts?.test ?? "") ? "node:test" : pkg.scripts?.test ? "package-script" : null,
    linter: pkg.devDependencies?.eslint ? "eslint" : null,
    database: present("supabase") ? "PostgreSQL/Supabase: contratos locais; remoto não verificado" : null,
    migrations: present("supabase/isolated") ? "SQL isolado; sem inferir Prisma" : null,
    scm: present(".git") ? "git" : null,
    ci: present(".github/workflows") ? "github-actions" : null,
    visual: pkg.devDependencies?.["@playwright/test"] ? "playwright" : null,
  };
}

export const profiles = {
  quick: ["scm", "types", "unit", "routes", "interactions", "security", "assets", "memory", "remote-db"],
  complete: ["scm", "lint", "types", "unit", "routes", "interactions", "security", "assets", "memory", "db-fixture", "browser", "dependencies", "remote-db", "manual-review"],
};

export function createRegistry({ root, execute }) {
  const present = (file) => existsSync(path.join(root, file));
  const node = process.execPath;
  const unavailable = (summary) => ({ status: "unavailable", summary });
  const fileCheck = (id, category, description, entry, args = []) => ({
    id, category, description,
    async run() {
      if (!present(entry)) return unavailable(`Ferramenta local ausente: ${entry}. Execute npm ci quando apropriado.`);
      const result = await execute(node, [entry, ...args]);
      return { ...result, summary: result.status === "passed" ? description : `${description}: falhou (${result.reason ?? result.code ?? "sem código"}).` };
    },
  });
  const testFiles = (predicate) => readdirSync(path.join(root, "tests")).filter((file) => file.endsWith(".test.mjs") && predicate(file)).sort().map((file) => `tests/${file}`);
  const tests = (id, description, predicate) => ({
    id, category: id === "unit" ? "test" : "db", description,
    async run() {
      const files = testFiles(predicate);
      if (!files.length) return unavailable("Nenhum teste encontrado; não foi tratado como sucesso.");
      const result = await execute(node, ["--experimental-strip-types", "--test", "--test-concurrency=1", "--test-reporter=tap", ...files]);
      const match = (key) => result.output.match(new RegExp(`^# ${key} (\\d+)`, "m"))?.[1];
      const total = match("tests"), failed = match("fail");
      const counts = total !== undefined && failed !== undefined ? { total: Number(total), failed: Number(failed), passed: Number(match("pass") ?? 0), skipped: Number(match("skipped") ?? 0) } : null;
      return { ...result, tests: counts, summary: counts ? `${counts.passed}/${counts.total} testes passaram; ${counts.failed} falharam; ${counts.skipped} ignorados. ${id === "db-fixture" ? "Banco sintético PGlite; não valida produção." : ""}`.trim() : `Runner ${result.status}; contagem não disponível na saída capturada.` };
    },
  });
  return [
    {
      id: "scm", category: "scm", description: "Ler branch, HEAD e estado do Git, preservando alterações locais.",
      async run() {
        const branch = await execute("git", ["branch", "--show-current"]);
        const head = await execute("git", ["rev-parse", "HEAD"]);
        const status = await execute("git", ["status", "--porcelain", "--untracked-files=normal"]);
        if ([branch, head, status].some((result) => result.status !== "passed")) return unavailable("Git indisponível ou checkout inválido.");
        const dirtyFileCount = status.output.trim() ? status.output.trim().split(/\r?\n/).length : 0;
        return { status: dirtyFileCount ? "warning" : "passed", summary: dirtyFileCount ? `${dirtyFileCount} entradas locais preservadas; revisar antes de publicar.` : "Checkout limpo.", details: { branch: branch.output.trim() || "detached", head: head.output.trim(), dirtyFileCount } };
      },
    },
    fileCheck("lint", "code", "ESLint do projeto", "node_modules/eslint/bin/eslint.js", ["."]),
    fileCheck("types", "code", "TypeScript sem emitir arquivos", "node_modules/typescript/bin/tsc", ["--noEmit", "--incremental", "false"]),
    tests("unit", "Testes do projeto, incluindo contratos sintéticos", () => true),
    fileCheck("routes", "code", "Auditoria estática de rotas", "scripts/audit-routes.mjs"),
    fileCheck("interactions", "code", "Auditoria estática de interações", "scripts/audit-interactions.mjs"),
    fileCheck("security", "security", "Regras estáticas de qualidade/segurança existentes; não substituem SAST completo", "scripts/audit-quality.mjs"),
    fileCheck("assets", "visual", "Verificar conteúdo, dimensões e alpha dos assets Aero", "scripts/optimize-aero-assets.mjs", ["--check"]),
    fileCheck("memory", "config", "Verificar hashes e links da memória versionada", "scripts/second-brain-check.mjs"),
    tests("db-fixture", "Contratos SQL/RLS isolados em PGlite", (file) => file.endsWith("-db.test.mjs")),
    {
      id: "browser", category: "visual", description: "Regressões reais de perfil, IFOS, temas, responsividade e fluxos na fixture local",
      async run() {
        if (!present("node_modules/@playwright/test/cli.js")) return unavailable("Playwright local ausente. Execute npm ci e instale Chromium.");
        const nextEnv = path.join(root, "next-env.d.ts");
        const before = present("next-env.d.ts") ? readFileSync(nextEnv, "utf8") : null;
        const agentsPath = path.join(root, "AGENTS.md");
        const agentsBefore = present("AGENTS.md") ? readFileSync(agentsPath, "utf8") : null;
        const normalize = (text) => text.replace(/\r\n/g, "\n").replace(/^import ["']\.\/\.next(?:-academic)?\/(?:dev\/)?types\/(routes|root-params)\.d\.ts["'];?$/gm, 'import "GENERATED_NEXT_TYPES/$1";');
        const result = await execute(node, ["scripts/run-academic-e2e.mjs"]);
        if (before === null || !present("next-env.d.ts")) return { status: "failed", summary: "next-env.d.ts foi criado/removido durante a execução; preservar estado para revisão.", browserExecution: result };
        // Next dev changes only these generated imports. Preserve any concurrent human edit.
        if (before !== null && present("next-env.d.ts")) {
          const after = readFileSync(nextEnv, "utf8");
          if (after !== before) {
            if (normalize(after) === normalize(before)) writeFileSync(nextEnv, before);
            else return { status: "failed", summary: "next-env.d.ts recebeu mudanças além dos imports gerados; arquivo preservado para revisão.", browserExecution: result };
          }
        }
        const agentsAfter = present("AGENTS.md") ? readFileSync(agentsPath, "utf8") : null;
        if (agentsAfter !== agentsBefore) return { status: result.status === "failed" ? "failed" : "warning", summary: "Next alterou AGENTS.md; alteração preservada. Revise as instruções e recatalogue a memória.", browserExecution: result };
        return { ...result, summary: result.status === "passed" ? "Suíte sintética Playwright passou; imports gerados restaurados." : "Suíte sintética Playwright não concluiu com sucesso." };
      },
    },
    {
      id: "dependencies", category: "security", description: "Consultar npm audit para dependências de execução; requer --network.",
      async run({ options }) {
        if (!options.network) return unavailable("Consulta à rede desativada. Use --network para consultar npm audit.");
        const npm = [process.env.npm_execpath, path.join(path.dirname(node), "node_modules/npm/bin/npm-cli.js")].find((file) => file && existsSync(file));
        if (!npm) return unavailable("npm-cli.js não localizado; execute por npm run maintain.");
        const result = await execute(node, [npm, "audit", "--omit=dev", "--json"], { limit: 1000000 });
        if (result.reason) return { ...result, summary: "Consulta npm audit não concluiu." };
        try {
          const audit = JSON.parse(result.output);
          if (audit.error || !audit.metadata?.vulnerabilities) return { status: "unavailable", summary: "Registro não devolveu uma auditoria válida." };
          const counts = audit.metadata.vulnerabilities;
          const advisories = Object.entries(audit.vulnerabilities ?? {}).flatMap(([name, value]) => value.via.filter((entry) => typeof entry === "object").map(({ title, url, severity, cwe }) => ({ name, title, url, severity, cwe })));
          return { status: counts.total > 0 ? "failed" : result.code === 0 ? "passed" : "failed", summary: `${counts.total} vulnerabilidades reportadas pelo npm (dependências de execução).`, details: { counts, advisories } };
        } catch { return { status: "failed", summary: "Saída npm audit inválida ou maior que o limite de captura." }; }
      },
    },
    { id: "remote-db", category: "db", description: "Registrar ausência de auditoria remota homologada.", run: async () => unavailable("Banco remoto não auditado: faltam acesso autorizado e contrato homologado. PK/FK, grants, dados, índices, backup e migrações remotas não foram executados.") },
    { id: "manual-review", category: "visual", description: "Registrar limites da validação visual automática.", run: async () => unavailable("Leitor de tela real, consistência editorial, métricas de campo e comparação visual com baseline aprovado exigem revisão específica. Não foram inferidos dos testes ou de screenshots antigos.") },
  ];
}
