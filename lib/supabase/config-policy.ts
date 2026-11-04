export const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const productionHost = "xqhilujzacwebeexljaf.supabase.co";

export function resolveSupabaseConfiguration(input: { url?: string; key?: string; nodeEnv?: string; allowProductionInDev?: boolean }) {
  const url = input.url?.trim() || LOCAL_SUPABASE_URL;
  const key = input.key?.trim() || "";
  let error: string | null = null;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.search || parsed.hash || !["https:", "http:"].includes(parsed.protocol)) throw new Error("url");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !local) throw new Error("https");
    if (input.nodeEnv !== "production" && parsed.hostname === productionHost && input.allowProductionInDev !== true) {
      error = "Desenvolvimento e testes não podem usar o Supabase de produção. Configure um projeto local ou de homologação.";
    }
    if (parsed.pathname !== "/") throw new Error("path");
  } catch {
    error = "NEXT_PUBLIC_SUPABASE_URL inválida. Use a URL base de um Supabase local ou de homologação.";
  }
  if (!error && (!input.url?.trim() || !key)) {
    error = "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY do mesmo ambiente.";
  }
  if (!error && /^sb_secret_/i.test(key)) error = "A configuração pública aceita somente uma chave publicável.";
  if (!error && key.split(".").length === 3) {
    try {
      const encoded = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(encoded));
      if (payload.role !== "anon") error = "A configuração pública aceita somente uma chave publicável ou anon.";
    } catch { error = "Chave pública Supabase inválida."; }
  }
  if (!error && key.split(".").length !== 3 && !key.startsWith("sb_publishable_")) error = "Use a chave publicável ou anon emitida pelo ambiente Supabase.";
  return { url: error ? LOCAL_SUPABASE_URL : url, key: error ? "" : key, configured: !error, error };
}
