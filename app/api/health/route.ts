import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sifcas_health");

    if (error) {
      return NextResponse.json(
        { ok: false, service: "sifcas", database: "error", error: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, service: "sifcas", database: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "sifcas",
        database: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
