import { loadPublicNoticeCatalog } from "@/lib/public-notices-server";
import { noticeCalendar } from "@/lib/public-notices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (!id || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) return new Response("Edital inválido.", { status: 400 });
  const days = Number(params.get("lembrar") ?? 1);
  const { notices } = await loadPublicNoticeCatalog();
  const notice = notices.find((item) => item.id === id);
  if (!notice) return new Response("Edital não encontrado.", { status: 404 });
  try {
    const calendar = noticeCalendar(notice, new Date(), days);
    return new Response(calendar, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="edital-${notice.number.replace(/[^0-9]/g, "")}-${notice.year}.ics"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("O lembrete exige prazo aberto, metadados revisados e antecedência de 1, 3 ou 7 dias. Confira a fonte oficial.", { status: 409, headers: { "Cache-Control": "no-store" } });
  }
}
