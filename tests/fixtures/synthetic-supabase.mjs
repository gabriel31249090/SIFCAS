import { createServer } from "node:http";
import { generateKeyPairSync, randomBytes, sign, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const actorIds = { teacher: 1, otherTeacher: 2, student: 3, otherStudent: 4, manager: 5, admin: 6, suspended: 7 };
const procedures = {
  preview_academic_import: [["p_diary_id", "uuid"], ["p_external_id", "text"], ["p_period", "text"], ["p_filename", "text"], ["p_records", "jsonb"]],
  apply_academic_import: [["p_batch_id", "uuid"]], cancel_academic_import: [["p_batch_id", "uuid"]],
  import_personal_calendar: [["p_events", "jsonb"]], clear_personal_calendar: [], sifcas_health: [],
};
const identifier = (value) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("Identificador de teste inválido.");
  return `"${value}"`;
};

/** Synthetic testing adapter, not Supabase/PostgREST or a production integration. */
export async function startSyntheticSupabase() {
  if (process.env.NODE_ENV === "production" || process.env.SIFCAS_SYNTHETIC_FIXTURE !== "1") throw new Error("Fixture só pode ser iniciada explicitamente fora de produção.");
  const db = new PGlite(); await db.waitReady;
  for (const path of ["supabase/isolated/academic-import.fixture.sql", "supabase/isolated/academic-import.sql", "supabase/isolated/academic-import.seed.sql", "supabase/isolated/personal-calendar.sql", "tests/fixtures/academic-browser.sql"]) await db.exec(readFileSync(path, "utf8"));
  const columns = await db.query("select table_name,column_name,data_type from information_schema.columns where table_schema='public'");
  const schema = new Map();
  const dateColumns = new Map();
  for (const row of columns.rows) { const names = schema.get(row.table_name) ?? new Set(); names.add(row.column_name); schema.set(row.table_name, names); }
  for (const row of columns.rows) if (row.data_type === "date") { const dates = dateColumns.get(row.table_name) ?? new Set(); dates.add(row.column_name); dateColumns.set(row.table_name, dates); }
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const kid = randomBytes(12).toString("hex");
  const jwk = { ...publicKey.export({ format: "jwk" }), kid, alg: "ES256", use: "sig" };
  const publishableKey = `sb_publishable_${randomBytes(24).toString("base64url")}`;
  const url = "http://127.0.0.1:54331";
  const sessions = {};
  for (const [actor, suffix] of Object.entries(actorIds)) {
    const userId = `10000000-0000-0000-0000-${String(suffix).padStart(12, "0")}`;
    const now = Math.floor(Date.now() / 1000);
    const user = { id: userId, aud: "authenticated", role: "authenticated", email: `${actor}@example.invalid`, app_metadata: { provider: "synthetic-fixture" }, user_metadata: {}, created_at: new Date().toISOString() };
    const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT", kid })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ iss: `${url}/auth/v1`, sub: userId, aud: "authenticated", role: "authenticated", email: user.email, iat: now, exp: now + 7200, session_id: "50000000-0000-0000-0000-000000000001" })).toString("base64url");
    const unsigned = `${header}.${payload}`;
    const signature = sign("sha256", Buffer.from(unsigned), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
    sessions[actor] = { access_token: `${unsigned}.${signature}`, refresh_token: randomBytes(32).toString("base64url"), expires_in: 7200, expires_at: now + 7200, token_type: "bearer", user };
  }
  function claims(request) {
    const token = request.headers.authorization?.replace(/^Bearer /i, "");
    if (!token || token === publishableKey) return null;
    const [header, payload, signature, extra] = token.split(".");
    if (!header || !payload || !signature || extra || !verify("sha256", Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(signature, "base64url"))) throw new Error("Assinatura inválida.");
    const metadata = JSON.parse(Buffer.from(header, "base64url"));
    const body = JSON.parse(Buffer.from(payload, "base64url"));
    if (metadata.alg !== "ES256" || metadata.kid !== kid || body.exp <= Date.now() / 1000 || body.iss !== `${url}/auth/v1` || !Object.values(sessions).some((session) => session.user.id === body.sub)) throw new Error("Sessão de teste inválida.");
    return body;
  }
  let queue = Promise.resolve();
  function transaction(actor, operation) {
    const next = queue.then(async () => {
      await db.exec("begin");
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [actor?.sub ?? ""]);
        await db.exec(actor ? "set local role authenticated" : "set local role anon");
        const result = await operation(); await db.exec("commit"); return result;
      } catch (error) { await db.exec("rollback"); throw error; }
    });
    queue = next.catch(() => {}); return next;
  }
  const server = createServer(async (request, response) => {
    const respond = (status, body, headers = {}) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }); response.end(request.method === "HEAD" ? "" : JSON.stringify(body)); };
    try {
      const target = new URL(request.url, url);
      if (target.pathname === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        response.end(`<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SIFCAS — cenário sintético local</title><style>body{margin:0;background:linear-gradient(140deg,#d9f3ff,#eff9df);font:16px/1.6 system-ui;color:#234e67;min-height:100vh;display:grid;place-items:center}main{max-width:620px;margin:24px;padding:36px;background:#ffffffe8;border:1px solid white;border-radius:24px;box-shadow:0 14px 50px #24799b18}h1{font-size:30px;line-height:1.2}small{color:#53794b}nav{display:flex;flex-wrap:wrap;gap:12px}a{padding:12px 18px;border:1px solid #b9dfea;border-radius:12px;background:linear-gradient(#fff,#e6f5fc);color:#226d8e;text-decoration:none}a:focus-visible{outline:3px solid #117fab}p{color:#54758a}</style><main><small>DEMONSTRAÇÃO LOCAL · DADOS FICTÍCIOS</small><h1>Explore o SIFCAS em segurança.</h1><p>Escolha uma sessão sintética. O aplicativo verifica sua assinatura e as regras de acesso do banco isolado. Este ambiente não está conectado ao SUAP/AVA nem ao Supabase institucional. Os dados são descartados ao encerrar.</p><nav><a href="/__fixture/open?actor=teacher">Professor</a><a href="/__fixture/open?actor=student">Estudante</a><a href="/__fixture/open?actor=manager">Gestor</a><a href="/__fixture/open?actor=otherTeacher">Outro docente</a></nav></main></html>`);
        return;
      }
      if (target.pathname === "/__fixture/open") {
        const session = sessions[target.searchParams.get("actor")];
        if (!session) return respond(404, { error: "Ator sintético desconhecido." });
        response.writeHead(302, { "Location": "http://127.0.0.1:3100/", "Cache-Control": "no-store", "Set-Cookie": `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}; Path=/; SameSite=Lax` });
        response.end(); return;
      }
      if (target.pathname === "/__fixture/ready") return respond(200, { synthetic: true });
      if (target.pathname === "/__fixture/session") {
        const session = sessions[target.searchParams.get("actor")];
        if (!session) return respond(404, { error: "Ator sintético desconhecido." });
        return respond(200, { synthetic: true, session, cookie: { name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "127.0.0.1", path: "/", httpOnly: false, secure: false, sameSite: "Lax" } });
      }
      if (target.pathname === "/auth/v1/.well-known/jwks.json") return respond(200, { keys: [jwk] });
      const actor = claims(request);
      if (target.pathname === "/auth/v1/user") return actor ? respond(200, Object.values(sessions).find((session) => session.user.id === actor.sub).user) : respond(401, { message: "Sessão obrigatória." });
      if (!target.pathname.startsWith("/rest/v1/")) return respond(404, { message: "Endpoint fora do contrato sintético." });
      if (request.headers.apikey !== publishableKey) return respond(401, { message: "Chave de fixture inválida." });
      if (target.pathname.startsWith("/rest/v1/rpc/")) {
        const name = target.pathname.split("/").at(-1);
        if (!Object.hasOwn(procedures, name) || request.method !== "POST") return respond(404, { message: "RPC fora do contrato." });
        let bytes = 0; const chunks = [];
        for await (const chunk of request) { bytes += chunk.length; if (bytes > 2_500_000) return respond(413, { message: "Payload excedido." }); chunks.push(chunk); }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        const signature = procedures[name];
        if (Object.keys(body).some((key) => !signature.some(([field]) => field === key))) return respond(400, { message: "Parâmetro desconhecido." });
        const args = signature.map(([field, type], index) => `$${index + 1}::${type}`).join(",");
        const values = signature.map(([field, type]) => type === "jsonb" ? JSON.stringify(body[field]) : body[field] ?? null);
        const result = await transaction(actor, () => db.query(`select public.${identifier(name)}(${args}) as result`, values));
        return respond(200, result.rows[0].result);
      }
      if (!["GET", "HEAD"].includes(request.method)) return respond(405, { message: "Fixture permite apenas leitura e RPCs homologadas." });
      const table = target.pathname.split("/").at(-1);
      if (!schema.has(table)) return respond(404, { code: "42P01", message: "Tabela ausente no contrato de teste." });
      const allowed = schema.get(table);
      const column = (name) => { if (!allowed.has(name)) throw new Error("Coluna fora do contrato."); return identifier(name); };
      const selected = target.searchParams.get("select") ?? "*";
      const selection = selected === "*" ? "*" : selected.split(",").map(column).join(",");
      const values = [];
      const bind = (value) => { values.push(value); return `$${values.length}`; };
      const conditions = [];
      for (const [name, raw] of target.searchParams) {
        if (["select", "order", "offset", "limit"].includes(name)) continue;
        const field = column(name);
        const separator = raw.indexOf("."); const operation = raw.slice(0, separator); const value = raw.slice(separator + 1);
        if (operation === "is" && value === "null") conditions.push(`${field} is null`);
        else if (operation === "in" && value.startsWith("(") && value.endsWith(")")) {
          const list = value.slice(1, -1).split(",").map((entry) => entry.replace(/^"|"$/g, ""));
          conditions.push(`${field} in (${list.map(bind).join(",")})`);
        } else {
          const operator = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" }[operation];
          if (!operator) throw new Error("Filtro fora do contrato.");
          conditions.push(`${field} ${operator} ${bind(value)}`);
        }
      }
      const where = conditions.length ? ` where ${conditions.join(" and ")}` : "";
      const ordering = target.searchParams.get("order");
      const order = ordering ? " order by " + ordering.split(",").map((part) => { const [field, direction, nulls] = part.split("."); return `${column(field)} ${direction === "desc" ? "desc" : "asc"}${nulls === "nullsfirst" ? " nulls first" : nulls === "nullslast" ? " nulls last" : ""}`; }).join(",") : "";
      const range = request.headers.range?.match(/^(\d+)-(\d+)$/);
      const offset = Number(target.searchParams.get("offset") ?? range?.[1] ?? 0);
      const requested = Number(target.searchParams.get("limit") ?? (range ? Number(range[2]) - offset + 1 : 1000));
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(requested) || requested < 0 || requested > 10000) throw new Error("Range inválido.");
      const limit = Math.min(requested, 1000);
      const result = await transaction(actor, async () => {
        const count = await db.query(`select count(*)::int as count from public.${identifier(table)}${where}`, values);
        const rows = request.method === "HEAD" ? [] : (await db.query(`select ${selection} from public.${identifier(table)}${where}${order} limit ${limit} offset ${offset}`, values)).rows;
        for (const row of rows) for (const field of dateColumns.get(table) ?? []) if (row[field]) row[field] = row[field] instanceof Date ? row[field].toISOString().slice(0, 10) : String(row[field]).slice(0, 10);
        return { rows, count: count.rows[0].count };
      });
      const single = request.headers.accept?.includes("application/vnd.pgrst.object+json");
      const headers = { "Content-Range": `${offset}-${Math.max(offset, offset + result.rows.length - 1)}/${result.count}`, "Access-Control-Expose-Headers": "Content-Range" };
      if (single && result.rows.length !== 1) return respond(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${result.rows.length} rows` }, headers);
      return respond(200, single ? result.rows[0] : result.rows, headers);
    } catch (error) {
      respond(error.code === "42501" ? 403 : 400, { code: error.code ?? "FIXTURE_CONTRACT", message: error.message });
    }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(54331, "127.0.0.1", resolve); });
  return { url, publishableKey, close: async () => { await new Promise((resolve) => server.close(resolve)); await queue; await db.close(); } };
}
