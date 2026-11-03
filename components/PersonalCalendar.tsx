import Link from "next/link";
import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { clearPersonalCalendar } from "@/app/importar-calendario/actions";

export async function PersonalCalendar({ account }: { account: CurrentAccount }) {
  let events: Array<{ uid: string; title: string; event_date: string; event_time: string | null; timezone: string | null; cancelled: boolean; updated_at: string }> = [];
  let available = process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED === "true";
  if (available) {
    try {
      const client = await createClient();
      const { data, error } = await client.from("personal_calendar_events").select("uid,title,event_date,event_time,timezone,cancelled,updated_at").eq("owner_id", account.id).order("event_date").order("uid").limit(501);
      if (error) available = false;
      else events = data ?? [];
    } catch { available = false; }
  }
  return <section className="card panel" style={{ marginTop: 18 }}><h2>Agenda privada do AVA</h2><p>Cópia de arquivo, separada das notas e da agenda institucional. A atualização depende de nova importação.</p>
    {!available ? <p role="status">Importação aguardando configuração ou fonte indisponível. Confira suas pendências no AVA.</p>
      : !events.length ? <p>Nenhum evento importado na sua área privada.</p>
        : <div className="tableScroll"><table className="dataTable"><thead><tr><th>Evento</th><th>Data / horário na origem</th><th>Última importação</th></tr></thead><tbody>{events.slice(0, 500).map((event) => <tr key={event.uid}>
          <td>{event.title}{event.cancelled ? " · Cancelado" : ""}</td><td>{event.event_date} · {event.event_time ? `${event.event_time} (${event.timezone})` : "Dia inteiro"}</td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(event.updated_at))}</td>
        </tr>)}</tbody></table>{events.length > 500 && <p>Exibidos os primeiros 500 eventos.</p>}</div>}
    <Link className="button soft" href="/importar-calendario">Importar arquivo .ics</Link>
    {available && events.length > 0 && <form action={clearPersonalCalendar} className="formStack"><label><input type="checkbox" name="confirmed" value="yes" required/> Descartar todos os eventos da minha cópia privada.</label><button className="button soft" type="submit">Descartar cópia privada</button></form>}
  </section>;
}
