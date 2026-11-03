export type TodayKind = "class" | "assessment" | "task" | "event" | "notice";
export type TodayItem = {
  id: string; kind: TodayKind; title: string; detail: string; date: string; time: string | null;
  href: string; sourceId: string; sourceLabel: string; imported: boolean;
  timeZone: "America/Cuiaba" | null; updatedAt: string | null;
};
export type TodaySource = {
  id: string; label: string; status: "ready" | "imported" | "unavailable" | "not_configured";
  detail: string; href: string; updatedAt: string | null;
};

export function cuiabaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map((kind) => parts.find((part) => part.type === kind)?.value).join("-");
}

export function shiftDate(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function validTodayDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Dates without a confirmed timezone stay in the source's calendar. */
export function calendarInCuiaba(event: { date: string; time: string | null; timezone: string | null }) {
  if (!validTodayDate(event.date)) return null;
  if (!event.time) return { date: event.date, time: null, timeZone: null };
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(event.time)) return null;
  if (event.timezone === "America/Cuiaba") return { date: event.date, time: event.time.slice(0, 5), timeZone: "America/Cuiaba" as const };
  if (event.timezone !== "UTC") return { date: event.date, time: event.time.slice(0, 5), timeZone: null };
  const instant = new Date(`${event.date}T${event.time.length === 5 ? event.time + ":00" : event.time}Z`);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Cuiaba", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
  return { date: cuiabaDate(instant), time, timeZone: "America/Cuiaba" as const };
}

/** Expand a weekly schedule to one occurrence in the coming seven days. */
export function nextScheduleDate(today: string, weekdaySundayZero: number) {
  if (!validTodayDate(today) || !Number.isInteger(weekdaySundayZero) || weekdaySundayZero < 0 || weekdaySundayZero > 6) return null;
  const current = new Date(`${today}T12:00:00Z`).getUTCDay();
  return shiftDate(today, (weekdaySundayZero - current + 7) % 7);
}

export function buildToday(items: TodayItem[], sources: TodaySource[], now: Date) {
  const today = cuiabaDate(now);
  const through = shiftDate(today, 7);
  const unique = new Map<string, TodayItem>();
  for (const item of items) {
    if (!validTodayDate(item.date) || item.date < today || item.date > through) continue;
    // IDs are scoped by source; similar titles from SUAP/AVA are not assumed duplicates.
    unique.set(`${item.sourceId}:${item.id}`, item);
  }
  const ordered = [...unique.values()].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.title.localeCompare(b.title, "pt-BR"));
  const unavailable = sources.some((source) => source.status === "unavailable");
  const notConnected = sources.some((source) => source.status === "not_configured");
  const todayItems = ordered.filter((item) => item.date === today);
  return {
    today, items: ordered, todayItems, sources, incomplete: unavailable || notConnected,
    emptyMessage: unavailable ? "Algumas fontes estão indisponíveis. Consulte também os sistemas de origem."
      : notConnected ? "Nenhum item disponível nestas fontes hoje. Confira também o SUAP e o AVA."
        : "Nenhum item publicado para hoje nas fontes consultadas.",
  };
}
