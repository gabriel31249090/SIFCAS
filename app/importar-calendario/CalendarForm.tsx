"use client";

import { useRef, useState } from "react";
import { parseCalendar, type PersonalCalendarEvent } from "@/lib/ical";
import { decodeCsvBytes } from "@/lib/csv";
import { importPersonalCalendar } from "./actions";

export function CalendarForm() {
  const [events, setEvents] = useState<PersonalCalendarEvent[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selection = useRef(0);
  return <form action={importPersonalCalendar} className="formStack">
    <label>Arquivo .ics exportado pelo seu AVA<input name="file" type="file" accept=".ics,text/calendar" required onChange={async (event) => {
      setEvents([]); setError(""); setPending(true);
      const selected = ++selection.current;
      const file = event.target.files?.[0];
      try {
        if (file) {
          const parsed = parseCalendar(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
          if (selected === selection.current) setEvents(parsed);
        }
      }
      catch (cause) { if (selected === selection.current) setError(cause instanceof Error ? cause.message : "Calendário inválido."); }
      finally { if (selected === selection.current) setPending(false); }
    }}/></label>
    {error && <p role="alert">{error}</p>}
    {events.length > 0 && <><p role="status">Prévia: {events.length} eventos. Apenas títulos, identificadores, datas e situação serão guardados na sua área privada.</p>
      <div className="tableScroll"><table className="dataTable"><thead><tr><th>Evento</th><th>Data na origem</th><th>Horário / fuso</th></tr></thead><tbody>
        {events.slice(0, 20).map((item) => <tr key={item.uid}><td>{item.title}{item.cancelled ? " · Cancelado" : ""}</td><td>{item.date}</td><td>{item.time ? `${item.time} (${item.timezone})` : "Dia inteiro"}</td></tr>)}
      </tbody></table></div>
      {events.length > 20 && <p>Primeiros 20 eventos exibidos de {events.length}.</p>}
      <label><input type="checkbox" name="confirmed" value="yes" required/> Confirmo que esta é uma exportação autorizada para minha própria agenda.</label>
    </>}
    <button className="button primary" type="submit" disabled={!events.length || pending}>Confirmar importação privada</button>
  </form>;
}
