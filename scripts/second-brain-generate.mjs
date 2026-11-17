import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const vault = path.join(root, "docs", "second-brain");
export const catalog = path.join(vault, "20-Catalogo");
export const manifestPath = path.join(catalog, "manifest.json");
const allowedRoots = new Set(["app", "components", "lib", "supabase", "scripts", "tests", "public", ".github", "tools", "docs"]);
const rootFiles = new Set(["AGENTS.md", "CLAUDE.md", "README.md", "package.json", "package-lock.json", "proxy.ts", "next.config.ts", "eslint.config.mjs", "playwright.config.ts", "playwright.academic.config.ts", "tsconfig.json", "vercel.json", "frutiger-integracoes-plan.md"]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".pdf"]);
const slash = (value) => value.split(path.sep).join("/");
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const sourceHashFormats = { text: "sha256-utf8-lf-v1", binary: "sha256-raw-v1" };
const isTextSource = (file, bytes) => !binaryExtensions.has(path.extname(file).toLowerCase()) && !bytes.subarray(0, 1000).includes(0);
const canonicalText = (bytes) => bytes.toString("utf8").replace(/\r\n?/g, "\n");
export const sourceHash = (file, bytes) => sha256(isTextSource(file, bytes) ? canonicalText(bytes) : bytes);
const unique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "en"));
const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
}

export function sourcePaths() {
  // Git's ignore rules exclude local credentials, builds, node_modules and backups.
  // Additional exclusions keep generated memory and visual evidence out of recursion.
  return unique(git(["ls-files", "-c", "-o", "--exclude-standard", "-z"]).split("\0").filter(Boolean)).filter((file) => {
    if (!existsSync(path.join(root, file)) || file.startsWith("docs/second-brain/")) return false;
    if (/(^|\/)(?:\.env[^/]*|[^/]*(?:secret|credential|token)[^/]*\.(?:json|pem|key)|node_modules|\.next[^/]*|test-results|playwright-report|backups)(?:\/|$)/i.test(file)) return false;
    if (/^(?:docs\/previews|tools\/[^/]+\/evidence|reports)\//.test(file)) return false;
    return allowedRoots.has(file.split("/")[0]) || rootFiles.has(file);
  });
}

function category(file) {
  if (/^app\/.*\/(?:page|route)\.(?:tsx?|jsx?)$/.test(file) || /^app\/(?:page|robots|sitemap|manifest|opengraph-image)\./.test(file)) return "Rotas";
  if (/^app\/.*\/actions\./.test(file)) return "Acoes";
  if (file.startsWith("components/") || /^app\/.*\.(?:tsx|jsx)$/.test(file)) return "Componentes";
  if (file.startsWith("lib/")) return "Bibliotecas";
  if (file.startsWith("supabase/")) return "Banco";
  if (file.startsWith("tests/") || file.startsWith("tools/")) return "Testes-e-auditoria";
  if (file.startsWith("scripts/") || file.startsWith(".github/") || rootFiles.has(file) && !file.endsWith(".md")) return "Operacao";
  if (file.endsWith(".css") || file.startsWith("public/") || binaryExtensions.has(path.extname(file))) return "Estilos-e-assets";
  return "Documentacao";
}

export function routeFor(file) {
  if (!file.startsWith("app/")) return null;
  const metadata = { "app/robots.ts": "/robots.txt", "app/sitemap.ts": "/sitemap.xml", "app/manifest.ts": "/manifest.webmanifest", "app/opengraph-image.tsx": "/opengraph-image" };
  if (metadata[file]) return metadata[file];
  if (!/(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/.test(file)) return null;
  return `/${file.slice(4).replace(/(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/, "").split("/").filter((part) => part && !/^\(.*\)$/.test(part)).join("/")}`;
}

export function noteId(file) {
  const name = file.replaceAll("/", "--").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 165);
  return `${name}--${sha256(file).slice(0, 8)}`;
}

export function wiki(file, label = file) {
  return `[[20-Catalogo/Arquivos/${noteId(file)}|${label}]]`;
}

function domains(file) {
  const values = [];
  if (/auth|login|senha|supabase|usuarios|vinculos|security|safe-path|password|proxy|institutional-import|csv/.test(file)) values.push("10-Mapas/Auth-perfis-e-RLS");
  if (/academic|academico|diario|diary|boletim|horarios|avaliacoes|disciplinas|teacher|turmas|agenda-aluno|ical|personal-calendar|home-today/.test(file)) values.push("10-Mapas/Academico-e-importacoes");
  if (/maisa|service-request/.test(file)) values.push("10-Mapas/LUMA");
  if (/ifos|aero|student-experience|personalizacao|personalization|FocusTimer|PixelBurst|AppChrome|AppShell|Sidebar|Topbar|MobileNav/.test(file) || file.endsWith(".css")) values.push("10-Mapas/Personalizacao-Aero-e-IFOS");
  if (/public|notic|campus|edita|institucional|institutional|process|solicita|estagio|auxilio|projeto|tcc|pending|pendenc|notifica|servico|pesquisa|extensao|document|opportun|oportun/.test(file)) values.push("10-Mapas/Institucional-e-servicos");
  if (/integrac|import|cas-news|ical|supabase|public-notice|email|analytics|next.config|health/.test(file)) values.push("10-Mapas/Integracoes-e-limites");
  if (/^tests\/|^scripts\/|^tools\/|^\.github\/|playwright|package|vercel|PRODUCTION|QA_REPORT|audit/.test(file)) values.push("10-Mapas/Testes-deploy-e-operacoes");
  return values.length ? values : ["10-Mapas/Arquitetura-e-navegacao"];
}

function matches(text, regexp, group = 1) {
  return unique([...text.matchAll(regexp)].map((match) => match[group]).filter(Boolean));
}

export function inventory() {
  const paths = sourcePaths();
  const known = new Set(paths);
  return paths.map((file) => {
    const bytes = readFileSync(path.join(root, file));
    const textual = isTextSource(file, bytes);
    const content = textual ? canonicalText(bytes) : "";
    const code = /\.(?:[cm]?[jt]sx?|sql)$/.test(file);
    const imports = code ? matches(content, /(?:\bfrom\s*|\bimport\s*\(|\bimport\s+)["']([^"']+)["']/g) : [];
    const dependencies = [];
    for (const specifier of imports) {
      const base = specifier.startsWith("@/") ? specifier.slice(2) : specifier.startsWith(".") ? slash(path.normalize(path.join(path.dirname(file), specifier))) : null;
      if (!base) continue;
      const candidates = [base, ...[".ts", ".tsx", ".mjs", ".js", ".css"].map((extension) => base + extension), `${base}/index.ts`, `${base}/index.tsx`];
      const resolved = candidates.find((candidate) => known.has(candidate));
      if (resolved) dependencies.push(resolved);
    }
    const publicMatch = content.match(/(?:export\s+default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    return {
      path: file, hash: sourceHash(file, bytes), hashFormat: textual ? sourceHashFormats.text : sourceHashFormats.binary, bytes: bytes.length, lines: textual ? content.split("\n").length : null,
      category: category(file), route: routeFor(file), domains: domains(file),
      symbols: code ? matches(content, /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g) : [],
      defaultFunction: code ? publicMatch?.[1] ?? null : null,
      dependencies: unique(dependencies),
      tables: code ? matches(content, /\.from\(\s*["']([a-zA-Z_][\w]*)["']\s*\)/g) : [],
      rpcs: code ? matches(content, /\.rpc\(\s*["']([a-zA-Z_][\w]*)["']/g) : [],
      sqlTables: file.endsWith(".sql") ? matches(content, /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)/gi).map((name) => name.replace(/^public\./i, "")) : [],
      sqlFunctions: file.endsWith(".sql") ? matches(content, /\bcreate\s+(?:or\s+replace\s+)?function\s+([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)/gi).map((name) => name.replace(/^public\./i, "")) : [],
      sqlPolicies: file.endsWith(".sql") ? matches(content, /\bcreate\s+policy\s+(?:"([^"]+)"|([\w]+))/gi).concat(matches(content, /\bcreate\s+policy\s+([\w]+)/gi)) : [],
      rlsTables: file.endsWith(".sql") ? matches(content, /\balter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([\w]+)\s+enable\s+row\s+level\s+security/gi) : [],
      guards: code ? unique([/\brequireAccount\s*\(/.test(content) ? "requireAccount" : null, /\bgetCurrentAccount\s*\(/.test(content) ? "getCurrentAccount" : null, /\bcanAccess\s*\(/.test(content) ? "canAccess" : null, /auth\.getClaims\s*\(/.test(content) ? "auth.getClaims" : null, /auth\.getUser\s*\(/.test(content) ? "auth.getUser" : null, /\bSECURITY\s+DEFINER\b/i.test(content) ? "SECURITY DEFINER (revisar grants e corpo SQL)" : null].filter(Boolean)) : [],
      verbs: /\/route\.[jt]s$/.test(file) ? matches(content, /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/g) : [],
    };
  });
}

function sourceLink(file, noteFile) {
  return slash(path.relative(path.dirname(noteFile), path.join(root, file))).split("/").map((part) => encodeURIComponent(part)).join("/");
}

function list(values, render = (value) => `\`${value}\``) {
  return values.length ? values.map((value) => `- ${render(value)}`).join("\n") : "Nenhum identificado pela extração estática.";
}

function fileNote(entry, context) {
  const filename = path.join(catalog, "Arquivos", `${noteId(entry.path)}.md`);
  const sqlWarning = entry.path.startsWith("supabase/") ? "\nSQL local não comprova aplicação remota. Contratos `isolated/` usam dados sintéticos; patches exigem revisão. Não há baseline remota verificada.\n" : "";
  return `---\ntipo: inventario-gerado\nfonte: ${JSON.stringify(entry.path)}\nverificado_em: ${context.generatedAt}\ncommit_base: ${context.head}\nsha256: ${entry.hash}\nhash_formato: ${entry.hashFormat}\n---\n\n# ${entry.path}\n\nCategoria: **${entry.category}**. ${entry.bytes} bytes${entry.lines === null ? "; arquivo binário (somente metadados)" : `; ${entry.lines} linhas`}.\n\n[Fonte no repositório](${sourceLink(entry.path, filename)}). Formato: ${entry.hashFormat}. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.\n\n${entry.domains.map((domain) => `[[${domain}]]`).join(" · ")} · [[20-Catalogo/Indice]]\n\n${entry.route ? `Rota do App Router: \`${entry.route}\`${entry.verbs.length ? ` (${entry.verbs.join(", ")})` : ""}.\n\n` : ""}## Símbolos exportados\n\n${list(entry.symbols)}\n\n## Dependências locais resolvidas\n\n${list(entry.dependencies, (file) => wiki(file))}\n\n## Dados e autorização identificados\n\nTabelas consultadas: ${entry.tables.map((name) => `\`${name}\``).join(", ") || "nenhuma referência literal `.from()`"}.\n\nRPCs: ${entry.rpcs.map((name) => `\`${name}\``).join(", ") || "nenhuma referência literal `.rpc()`"}.\n\nGuards encontrados: ${entry.guards.join(", ") || "nenhum padrão reconhecido neste arquivo"}. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.\n${sqlWarning}${entry.sqlTables.length || entry.sqlFunctions.length || entry.sqlPolicies.length || entry.rlsTables.length ? `\nObjetos SQL declarados:\n\n${list([...entry.sqlTables.map((name) => `tabela: ${name}`), ...entry.sqlFunctions.map((name) => `função: ${name}`), ...entry.sqlPolicies.map((name) => `política: ${name}`), ...entry.rlsTables.map((name) => `RLS habilitado no arquivo: ${name}`)])}\n` : ""}\n## Limite desta evidência\n\nFicha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.\n`;
}

export function loadManifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

export function freshness(manifest) {
  const current = new Map(sourcePaths().map((file) => [file, sourceHash(file, readFileSync(path.join(root, file)))]));
  const expected = new Map(manifest.files.map((entry) => [entry.path, entry.hash]));
  return { added: [...current.keys()].filter((file) => !expected.has(file)), changed: [...current.keys()].filter((file) => expected.has(file) && expected.get(file) !== current.get(file)), removed: [...expected.keys()].filter((file) => !current.has(file)), headChanged: git(["rev-parse", "HEAD"]) !== manifest.head };
}

export function markdownFiles(directory = vault) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() && entry.name !== ".obsidian" ? markdownFiles(path.join(directory, entry.name)) : entry.isFile() && entry.name.endsWith(".md") ? [path.join(directory, entry.name)] : []);
}

export function validateLinks() {
  const files = markdownFiles();
  const notes = new Set(files.map((file) => slash(path.relative(vault, file)).replace(/\.md$/, "")));
  const broken = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.replaceAll("\\|", "|").matchAll(/\[\[([^\n]*?)\]\]/g)) {
      const target = match[1].split("|")[0].split("#")[0].replace(/\.md$/, "");
      if (!notes.has(target)) broken.push(`${slash(path.relative(vault, file))}: [[${target}]]`);
    }
    for (const match of text.matchAll(/(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, "");
      if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith("#")) continue;
      let resolved;
      try { resolved = path.resolve(path.dirname(file), decodeURIComponent(target.split("#")[0])); } catch { broken.push(`${slash(path.relative(vault, file))}: URL inválida ${target}`); continue; }
      if (!existsSync(resolved)) broken.push(`${slash(path.relative(vault, file))}: ${target}`);
    }
  }
  return { notes: files.length, broken };
}

export function generate() {
  mkdirSync(path.join(catalog, "Arquivos"), { recursive: true });
  const files = inventory();
  const context = { schemaVersion: 2, hashFormats: sourceHashFormats, textHashCanonicalization: "UTF-8 text, CRLF/CR converted to LF; binary hashes use original bytes", generatedAt: new Date().toISOString(), head: git(["rev-parse", "HEAD"]), extraction: "local-static-regex; no remote queries; no source bodies persisted", exclusions: [".env*", "credentials/secrets", "node_modules/builds", "backups", "generated memory", "visual audit evidence and screenshots"], files };
  const expectedNotes = new Set(files.map((entry) => `${noteId(entry.path)}.md`));
  for (const name of readdirSync(path.join(catalog, "Arquivos"))) {
    // Only remove obsolete generated Markdown notes in the fixed catalog folder.
    if (name.endsWith(".md") && !expectedNotes.has(name)) unlinkSync(path.join(catalog, "Arquivos", name));
  }
  for (const entry of files) writeFileSync(path.join(catalog, "Arquivos", `${noteId(entry.path)}.md`), fileNote(entry, context), "utf8");
  const groups = unique(files.map((entry) => entry.category));
  const routes = files.filter((entry) => entry.route);
  writeFileSync(path.join(catalog, "Indice.md"), `---\ntipo: indice-gerado\nverificado_em: ${context.generatedAt}\n---\n\n# Inventário completo\n\n${files.length} arquivos do escopo; ${routes.length} entradas de rota/metadados. Base Git: \`${context.head}\`. O manifesto registra caminhos, bytes, SHA-256 e relações. Arquivos locais modificados também entram no hash; o commit sozinho não descreve o snapshot.\n\n[[00-INICIO]] · [[20-Catalogo/Rotas]] · [[20-Catalogo/Banco-e-RPCs]] · [[20-Catalogo/Documentacao]] · [[02-Como-retomar]]\n\nO catálogo é derivado, não substitui o código. Padrões estáticos podem omitir chamadas dinâmicas. Arquivos sensíveis, builds, backups e evidências visuais volumosas ficam fora; o catálogo de assets do código permanece incluído.\n\n${groups.map((group) => `## ${group}\n\n${files.filter((entry) => entry.category === group).map((entry) => `- ${wiki(entry.path)}${entry.route ? ` — \`${entry.route}\`` : ""}`).join("\n")}`).join("\n\n")}\n`, "utf8");
  writeFileSync(path.join(catalog, "Rotas.md"), `# Rotas e metadados\n\nExtração de todos os \`page.*\`, \`route.*\` e metadados previstos no App Router. Grupos entre parênteses são removidos do URL; parâmetros dinâmicos são preservados. O proxy é a referência de acesso; guards nesta tabela são apenas evidência local.\n\n[[10-Mapas/Arquitetura-e-navegacao]] · [[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]\n\n| URL | Tipo | Fonte | Guards reconhecidos |\n| --- | --- | --- | --- |\n${routes.map((entry) => `| ${escapeCell(entry.route)} | ${entry.verbs.join(", ") || (entry.path.includes("/page.") ? "página" : "metadado")} | ${escapeCell(wiki(entry.path))} | ${entry.guards.join(", ") || "conferir proxy/chamadores"} |`).join("\n")}\n`, "utf8");
  const tables = unique(files.flatMap((entry) => [...entry.tables, ...entry.sqlTables]));
  const rpcs = unique(files.flatMap((entry) => [...entry.rpcs, ...entry.sqlFunctions]));
  writeFileSync(path.join(catalog, "Banco-e-RPCs.md"), `# Contratos de banco e RPCs\n\n**Não há baseline remota verificada.** Uma referência no código não prova que o objeto exista ou tenha RLS correto no projeto remoto. Declarações SQL podem pertencer a fixtures mínimas ou patches isolados. Não aplicar automaticamente.\n\n[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]\n\n## Tabelas referenciadas ou declaradas\n\n${tables.map((name) => `### ${name}\n\n${files.filter((entry) => entry.tables.includes(name) || entry.sqlTables.includes(name)).map((entry) => `- ${wiki(entry.path)} — ${entry.sqlTables.includes(name) ? "declaração SQL local" : "consulta literal no código"}`).join("\n")}`).join("\n\n")}\n\n## RPCs chamadas ou funções SQL declaradas\n\n${rpcs.map((name) => `### ${name}\n\n${files.filter((entry) => entry.rpcs.includes(name) || entry.sqlFunctions.includes(name)).map((entry) => `- ${wiki(entry.path)} — ${entry.sqlFunctions.includes(name) ? "declaração SQL local" : "chamada no código"}`).join("\n")}`).join("\n\n")}\n`, "utf8");
  writeFileSync(path.join(catalog, "Documentacao.md"), `# Documentação existente\n\nNotas de referência; abra a fonte para contexto e confira a data antes de reutilizar conclusões. O inventário não copia documentos inteiros.\n\n[[00-INICIO]] · [[20-Catalogo/Indice]]\n\n${files.filter((entry) => entry.path.endsWith(".md")).map((entry) => `- ${wiki(entry.path)}`).join("\n")}\n`, "utf8");
  writeFileSync(manifestPath, `${JSON.stringify(context, null, 2)}\n`, "utf8");
  return { files: files.length, routes: routes.length, head: context.head, generatedAt: context.generatedAt };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(generate(), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
