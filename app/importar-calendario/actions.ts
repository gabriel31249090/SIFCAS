"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { decodeCsvBytes } from "@/lib/csv";
import { parseCalendar } from "@/lib/ical";

export async function importPersonalCalendar(formData: FormData) {
  await requireAccount();
  let count = 0;
  try {
    if (process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED !== "true") throw new Error("Importação aguardando configuração.");
    if (formData.get("confirmed") !== "yes") throw new Error("Confirme a prévia antes de importar.");
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".ics")) throw new Error("Selecione um arquivo .ics.");
    if (!file.size || file.size > 750 * 1024) throw new Error("O limite é de 750 KB.");
    const events = parseCalendar(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("import_personal_calendar", { p_events: events });
    if (error || data !== events.length) throw new Error("Não foi possível confirmar a importação privada. Verifique a configuração do ambiente.");
    count = data;
  } catch (error) {
    redirect(`/importar-calendario?error=${encodeURIComponent(error instanceof Error ? error.message : "Importação indisponível.")}`);
  }
  revalidatePath("/agenda-aluno");
  redirect(`/agenda-aluno?message=${encodeURIComponent(`${count} eventos importados para sua agenda privada; origem: arquivo AVA.`)}`);
}

export async function clearPersonalCalendar(formData: FormData) {
  await requireAccount();
  if (process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED !== "true" || formData.get("confirmed") !== "yes") redirect("/importar-calendario?error=Confirme%20o%20descarte%20da%20agenda%20privada.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("clear_personal_calendar");
  if (error) redirect("/importar-calendario?error=N%C3%A3o%20foi%20poss%C3%ADvel%20descartar%20a%20agenda.");
  revalidatePath("/agenda-aluno");
  redirect("/agenda-aluno?message=C%C3%B3pia%20pessoal%20do%20calend%C3%A1rio%20descartada.");
}
