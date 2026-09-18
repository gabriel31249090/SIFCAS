import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDifyConfig } from "@/lib/dify";

export const dynamic = "force-dynamic";

export async function GET() {
  const dify = getDifyConfig();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("sifcas_health");

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: "sifcas",
          database: "error",
          maisa: { configured: dify.configured },
          error: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "sifcas",
      database: data,
      maisa: { configured: dify.configured },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "sifcas",
        database: "unreachable",
        maisa: { configured: dify.configured },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
