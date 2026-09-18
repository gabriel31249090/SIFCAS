import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sifcas_health");

    if (error) {
      return NextResponse.json(
        { ok: false, service: "sifcas", database: "error", maisa: { configured: true, engine: "sifcas-local-v1" }, error: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "sifcas",
      database: data,
      maisa: { configured: true, engine: "sifcas-local-v1", external_provider: false },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, service: "sifcas", database: "unreachable", maisa: { configured: true, engine: "sifcas-local-v1" }, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 503 },
    );
  }
}
