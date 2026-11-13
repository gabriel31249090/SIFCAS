import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock3, Megaphone, Pin, Send, Users } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { listAgendaPublications, publicationKindLabels } from "@/lib/institutional";
import { loadPublicNoticeCatalog } from "@/lib/public-notices-server";
import { effectiveNoticeStatus, formatNoticeDate } from "@/lib/public-notices";
import { CampusResources } from "@/components/CampusResources";

export const metadata: Metadata = {
  title: "Agenda institucional",
  description: "Eventos e compromissos da agenda do SIFCAS, com exemplos simulados identificados e acesso à fonte oficial do campus.",
  alternates: { canonical: "/agenda-institucional" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function InstitutionalAgendaPage() {
  const account = await getCurrentAccount();
  const [agendaResult, noticeCatalog] = await Promise.allSettled([listAgendaPublications(), loadPublicNoticeCatalog()]);
  const entries = agendaResult.status === "fulfilled" ? agendaResult.value : [];
  const now = new Date();
  const publicDeadlines = noticeCatalog.status === "fulfilled" ? noticeCatalog.value.notices.filter((notice) => notice.closes && ["open", "scheduled"].includes(effectiveNoticeStatus(notice, now))) : [];
  const demoCount = entries.filter((row) => row.referenceCode?.startsWith("SIFCAS-DEMO-2026-")).length;
  const events = entries.filter((row) => row.kind === "event").length;
  const deadlines = entries.filter((row) => row.kind === "edital" && row.endsAt).length;
  const notices = entries.filter((row) => row.kind === "notice").length;
  const canPublish = !!account && account.accountStatus === "active" && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader title="Agenda Institucional" description="Eventos e prazos publicados no SIFCAS, com atalhos à central de editais revisados." action={canPublish ? <Link className="button soft" href="/painel-institucional"><Send size={16}/> Publicar compromisso</Link> : <span className="badge">Consulta pública</span>}/>

    {demoCount > 0 && <div className="infoBox" role="note" style={{ marginBottom: 16 }}><strong>Calendário de demonstração:</strong> {demoCount} itens de exemplo estão incluídos na agenda, sem validade oficial. Para datas reais, consulte o <Link href="/campus/calendario-academico">calendário acadêmico publicado pelo campus</Link>.</div>}

    {agendaResult.status === "rejected" && <div className="infoBox" role="status">A agenda do banco está indisponível. Isso não significa ausência de compromissos. O catálogo público de editais continua na central.</div>}
    {publicDeadlines.length > 0 && <>
      <SectionTitle title="Prazos da central de editais" description="Fontes revisadas; horários e fuso devem ser confirmados no documento original." href="/editais" linkLabel="Consultar todos os editais"/>
      <div className="searchResults">{publicDeadlines.map((notice) => <Link className="card searchResult" key={notice.id} href={`/editais?campus=all&q=${encodeURIComponent(`${notice.number}/${notice.year}`)}#${notice.id}`}><span className="iconBox"><Pin size={18}/></span><span><b>{notice.title}</b><small>{notice.campus} · Fechamento: {formatNoticeDate(notice.closes)}</small></span></Link>)}</div>
    </>}

    <div className="statGrid">
      <StatCard label="Itens na agenda" value={String(entries.length)} foot="Atuais e próximos" icon={CalendarDays}/>
      <StatCard label="Eventos" value={String(events)} foot="Programações publicadas" icon={Users}/>
      <StatCard label="Prazos" value={String(deadlines)} foot="Editais com data final" icon={Clock3}/>
      <StatCard label="Comunicados" value={String(notices)} foot="Avisos com agenda" icon={Megaphone}/>
    </div>

    <SectionTitle title="Próximos compromissos" description="Selecione um item para abrir todos os detalhes."/>
    {entries.length === 0 ? <div className="emptyState card"><CalendarDays size={28}/><h2>{agendaResult.status === "rejected" ? "Agenda temporariamente indisponível" : "Agenda sem compromissos publicados"}</h2><p>Confira também os prazos e a situação de revisão na <Link href="/editais">Central de Editais</Link>.</p></div> : <section className="card panel"><div className="tableScroll"><table className="dataTable"><thead><tr><th>Data / prazo</th><th>Tipo</th><th>Título</th><th>Local</th><th></th></tr></thead><tbody>
      {entries.map((row) => <tr key={row.id}>
        <td>{formatDate(row.startsAt ?? row.endsAt ?? row.publishedAt)}</td>
        <td><span className="badge">{publicationKindLabels[row.kind]}</span></td>
        <td><b>{row.title}</b>{row.referenceCode && <><br/><small>{row.referenceCode.startsWith("SIFCAS-DEMO-2026-") ? "Exemplo fictício • " : ""}{row.referenceCode}</small></>}</td>
        <td>{row.location || "—"}</td>
        <td><Link className="button soft" href={`/publicacoes/${row.id}`}>{row.kind === "edital" ? <Pin size={14}/> : <CalendarDays size={14}/>} Abrir</Link></td>
      </tr>)}
    </tbody></table></div></section>}
    <CampusResources title="Planeje sua rotina no campus" slugs={["calendario-academico", "horarios-oficiais", "biblioteca"]}/>
  </>;
}
