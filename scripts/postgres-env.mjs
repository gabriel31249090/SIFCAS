export function postgresEnvironment(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("A URL de conexão Postgres é inválida.");
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("A conexão precisa usar o protocolo postgres:// ou postgresql://.");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!parsed.hostname || !parsed.username || !database) {
    throw new Error("A conexão precisa informar host, usuário e banco.");
  }
  return {
    ...process.env,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port || "5432",
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: database,
    PGSSLMODE: parsed.searchParams.get("sslmode") || (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" ? "prefer" : "require"),
  };
}
