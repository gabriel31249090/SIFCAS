import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };
export async function GET() {
  const maisa = { configured: true, engine: "sifcas-local-v1", external_provider: false };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sifcas_health");
    if (error || data?.status !== "ok") {
      console.error("SIFCAS health check failed", error?.code ?? "unexpected_status");
      return NextResponse.json({ ok: false, service: "sifcas", database: { status: "unavailable" }, maisa }, { status: 503, headers });
    }
    return NextResponse.json({ ok: true, service: "sifcas", database: { status: "ok", service: "sifcas-db" }, maisa }, { headers });
  } catch {
    console.error("SIFCAS health dependency unreachable");
    return NextResponse.json({ ok: false, service: "sifcas", database: { status: "unreachable" }, maisa }, { status: 503, headers });
  }
}
