import { timingSafeEqual } from "node:crypto";
import { processMailQueue } from "@/lib/sifcas-mail/service";

export const maxDuration = 120;

export async function GET(request: Request) {
  const configured = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = configured ? `Bearer ${configured}` : "";
  if (!configured || Buffer.byteLength(header) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(header), Buffer.from(expected))) {
    return Response.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    // The free once-daily schedule may cover more than one class. The per-user
    // safety limit is still enforced by the queue processor.
    const result = await processMailQueue(undefined, 50);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Fila de e-mails indisponível." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
