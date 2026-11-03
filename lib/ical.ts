export type PersonalCalendarEvent = {
  uid: string; title: string; date: string; time: string | null;
  timezone: "UTC" | "America/Cuiaba" | null; cancelled: boolean;
};

/** Deliberately bounded subset: individual VEVENTs, dates, UTC and Cuiabá times. */
export function parseCalendar(text: string): PersonalCalendarEvent[] {
  if (new TextEncoder().encode(text).length > 750 * 1024 || /[\0\uFFFD]/.test(text)) throw new Error("Calendário inválido ou maior que 750 KB.");
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").trim().split("\n");
  if (lines[0] !== "BEGIN:VCALENDAR" || lines.at(-1) !== "END:VCALENDAR") throw new Error("Selecione um arquivo iCalendar (.ics) completo.");
  const events: PersonalCalendarEvent[] = [];
  const seen = new Set<string>();
  let current: Map<string, { params: string; value: string }> | null = null;
  const unescape = (value: string) => value.replace(/\\([nN,;\\])/g, (_, c: string) => c.toLowerCase() === "n" ? " " : c);
  for (const line of lines.slice(1, -1)) {
    if (line === "BEGIN:VEVENT") { if (current) throw new Error("Evento aninhado inválido."); current = new Map(); continue; }
    if (line === "END:VEVENT") {
      if (!current) throw new Error("Evento inválido.");
      const uid = current.get("UID")?.value ?? "";
      const title = unescape(current.get("SUMMARY")?.value ?? "");
      const start = current.get("DTSTART");
      if (!uid || uid.length > 200 || /[\u0000-\u001f]/.test(uid) || seen.has(uid) || !title || title.length > 300 || !start) throw new Error("Evento exige UID único, título e início válidos.");
      if (/https?:|token[=:]|auth[=:]/i.test(uid + title)) throw new Error("Remova URLs privadas ou tokens dos identificadores e títulos.");
      const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(start.value);
      if (!match) throw new Error("Data de evento inválida.");
      const date = `${match[1]}-${match[2]}-${match[3]}`;
      const parsed = new Date(`${date}T12:00:00Z`);
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Data de evento inválida.");
      const time = match[4] ? `${match[4]}:${match[5]}:${match[6]}` : null;
      let timezone: PersonalCalendarEvent["timezone"] = null;
      if (time) {
        if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) throw new Error("Horário de evento inválido.");
        if (match[7] && !start.params) timezone = "UTC";
        else if (!match[7] && start.params === ";TZID=America/Cuiaba") timezone = "America/Cuiaba";
        else throw new Error("Exporte horários UTC ou TZID=America/Cuiaba. Horários sem fuso precisam de revisão.");
      } else if (start.params !== ";VALUE=DATE") throw new Error("Data sem horário exige VALUE=DATE.");
      events.push({ uid, title, date, time, timezone, cancelled: current.get("STATUS")?.value === "CANCELLED" });
      if (events.length > 500) throw new Error("O calendário deve conter até 500 eventos.");
      seen.add(uid); current = null; continue;
    }
    if (!current) {
      if (/^(BEGIN|END):/.test(line)) throw new Error("Componentes de calendário não suportados. Exporte apenas eventos individuais.");
      continue;
    }
    const colon = line.indexOf(":");
    if (colon < 1) throw new Error("Propriedade de calendário inválida.");
    const property = line.slice(0, colon);
    const name = property.split(";")[0];
    if (["RRULE", "RDATE", "EXDATE", "RECURRENCE-ID", "BEGIN", "END", "DURATION"].includes(name)) throw new Error("Recorrências, durações e componentes embutidos precisam ser exportados como eventos individuais.");
    if (["UID", "SUMMARY", "DTSTART", "STATUS"].includes(name)) {
      if (current.has(name)) throw new Error("Propriedade de evento duplicada.");
      current.set(name, { params: property.slice(name.length), value: line.slice(colon + 1) });
    }
    // URLs, descrições, anexos, organizadores e participantes são descartados.
  }
  if (current || !events.length) throw new Error("Calendário sem eventos completos.");
  return events;
}
