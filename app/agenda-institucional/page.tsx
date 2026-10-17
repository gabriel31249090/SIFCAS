import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock3, Megaphone, Pin, Send, Users } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { listAgendaPublications, publicationKindLabels } from "@/lib/institutional";
import { CampusResources } from "@/components/CampusResources";

export const metadata: Metadata = {
  title: "Agenda institucional",
  description: "Eventos, prazos e compromissos oficiais do Campus Cáceres.",
  alternates: { canonical: "/agenda-institucional" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function InstitutionalAgendaPage() {
  const account = await getCurrentAccount();
  const [result] = await Promise.allSettled([listAgendaPublications()]);
  const unavailable = result.status === "rejected";
  const entries = result.status === "fulfilled" ? result.value : [];
  const events = entries.filter((row) => row.kind === "event").length;
  const deadlines = entries.filter((row) => row.kind === "edital" && row.endsAt).length;
  const notices = entries.filter((row) => row.kind === "notice").length;
  const canPublish = !!account && account.accountStatus === "active" && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader title="Agenda Institucional" description="Calendário real de eventos, prazos e compromissos publicados pela instituição e pelo campus." action={canPublish ? <Link className="button soft" href="/painel-institucional"><Send size={16}/> Publicar compromisso</Link> : <span className="badge">Agenda oficial</span>}/>

    <CampusResources title="Planeje sua rotina no campus" description="Calendário, horários e eventos nas publicações oficiais do IFMT." slugs={["calendario-academico", "horarios-oficiais", "eventos-sige"]}/>
    {!unavailable && <div className="statGrid">
      <StatCard label="Itens na agenda" value={String(entries.length)} foot="Atuais e próximos" icon={CalendarDays}/>
      <StatCard label="Eventos" value={String(events)} foot="Programações publicadas" icon={Users}/>
      <StatCard label="Prazos" value={String(deadlines)} foot="Editais com data final" icon={Clock3}/>
      <StatCard label="Comunicados" value={String(notices)} foot="Avisos com agenda" icon={Megaphone}/>
    </div>}

    <SectionTitle title="Próximos compromissos" description="Selecione um item para abrir todos os detalhes."/>
    {unavailable ? <div className="infoBox" role="status">Não foi possível carregar a agenda do SIFCAS agora. O calendário e os horários oficiais estão nos guias acima.</div> : entries.length === 0 ? <div className="emptyState card"><CalendarDays size={28}/><h2>Agenda sem compromissos publicados</h2><p>Eventos, prazos e comunicados futuros aparecerão aqui automaticamente.</p></div> : <section className="card panel"><div className="tableScroll"><table className="dataTable"><thead><tr><th>Data / prazo</th><th>Tipo</th><th>Título</th><th>Local</th><th></th></tr></thead><tbody>
      {entries.map((row) => <tr key={row.id}>
        <td>{formatDate(row.startsAt ?? row.endsAt ?? row.publishedAt)}</td>
        <td><span className="badge">{publicationKindLabels[row.kind]}</span></td>
        <td><b>{row.title}</b>{row.referenceCode && <><br/><small>{row.referenceCode}</small></>}</td>
        <td>{row.location || "—"}</td>
        <td><Link className="button soft" href={`/publicacoes/${row.id}`}>{row.kind === "edital" ? <Pin size={14}/> : <CalendarDays size={14}/>} Abrir</Link></td>
      </tr>)}
    </tbody></table></div></section>}
  </>;
}
