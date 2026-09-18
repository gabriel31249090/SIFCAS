import { NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const categories = new Set(["academic", "documents", "people", "infrastructure", "it", "transport", "other"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return Response.json({ error: "Faça login para abrir uma solicitação." }, { status: 401 });
  if (account.accountStatus === "suspended") return Response.json({ error: "Esta conta está suspensa." }, { status: 403 });

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ error: "Origem não permitida." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category : "other";
  const priority = typeof body.priority === "string" ? body.priority : "normal";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!categories.has(category) || !priorities.has(priority) || title.length < 3 || title.length > 180 || description.length > 8000) {
    return Response.json({ error: "Revise os dados da solicitação." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      requester_user_id: account.id,
      category,
      priority,
      title,
      description,
    })
    .select("id,status,created_at")
    .single();

  if (error) {
    console.error("MAISA service request insert failed", error.message);
    return Response.json({ error: "Não foi possível abrir a solicitação." }, { status: 500 });
  }

  return Response.json({ ok: true, request: data, message: "Solicitação aberta com sucesso." });
}
