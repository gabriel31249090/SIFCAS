import Link from "next/link";
import { Bell, BookOpenCheck, ClipboardList, FileClock, GraduationCap, ListTodo } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getPendingOverview, type PendingItem } from "@/lib/pending";

const groupLabels: Record<PendingItem["group"], string> = {
  notifications: "Notificações",
  services: "Solicitações",
  processes: "Processos",
  academic: "Acadêmico",
  applications: "Inscrições e candidaturas",
  tcc: "TCC",
};

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value.length === 10 ? value + "T12:00:00-04:00" : value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: value.length === 10 ? undefined : "short", timeZone: "America/Cuiaba" }).format(date);
}

export default async function PendingPage() {
  const account = await requireAccount();
  const overview = await getPendingOverview(account);
  const total = overview.items.length;

  return <>
    <PageHeader title="Central de Pendências" description="O que está aguardando leitura, análise, prazo ou acompanhamento em uma única tela." action={<span className="badge">{total} itens</span>}/>

    <div className="statGrid">
      <StatCard label="Notificações" value={String(overview.counts.notifications)} foot="Não lidas" icon={Bell}/>
      <StatCard label="Atendimento" value={String(overview.counts.services + overview.counts.processes)} foot="Solicitações e processos" icon={ClipboardList}/>
      <StatCard label="Acadêmico" value={String(overview.counts.academic + overview.counts.tcc)} foot="Avaliações e TCC" icon={GraduationCap}/>
      <StatCard label="Candidaturas" value={String(overview.counts.applications)} foot="Inscrições em análise" icon={FileClock}/>
    </div>

    <SectionTitle title="Itens que precisam de atenção" description="Abra qualquer item para continuar no módulo responsável."/>
    {total === 0 ? <div className="emptyState card"><BookOpenCheck size={30}/><h2>Sem pendências agora</h2><p>Quando surgir algo que precise da sua atenção, ele aparecerá aqui.</p></div> : <div className="pendingGrid">
      {overview.items.map((item) => <Link href={item.href} className="card pendingCard" key={item.id}>
        <div className="pendingCardTop"><span className="badge">{groupLabels[item.group]}</span><span className="badge">{item.status}</span></div>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
        <div className="pendingCardFoot"><span>{formatDate(item.date)}</span><strong>Abrir módulo →</strong></div>
      </Link>)}
    </div>}

    <div className="infoBox" style={{ marginTop: 18 }}><ListTodo size={15}/> A central não duplica dados: ela apenas reúne itens dos módulos originais respeitando as mesmas permissões e RLS.</div>
  </>;
}
