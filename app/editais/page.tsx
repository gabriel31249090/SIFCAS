import { getRequestTimestamp } from "@/lib/request-time";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, FileCheck2, Pin, Send, TimerReset } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { listPublishedPublications } from "@/lib/institutional";

export const metadata: Metadata = {
  title: "Editais e oportunidades",
  description: "Editais, bolsas, seleções e chamadas institucionais publicados no SIFCAS.",
  alternates: { canonical: "/editais" },
};

function formatDate(value: string | null) {
  if (!value) return "Sem prazo informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function EditaisPage() {
  const account = await getCurrentAccount();
  const editais = await listPublishedPublications(["edital"], 100);
  const now = getRequestTimestamp();
  const open = editais.filter((row) => !row.endsAt || new Date(row.endsAt).getTime() >= now).length;
  const endingSoon = editais.filter((row) => row.endsAt && new Date(row.endsAt).getTime() >= now && new Date(row.endsAt).getTime() <= now + 1000 * 60 * 60 * 24 * 14).length;
  const canPublish = !!account && account.accountStatus === "active" && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader title="Editais e Oportunidades" description="Editais, bolsas, processos seletivos e chamadas institucionais publicados no SIFCAS." action={canPublish ? <Link className="button soft" href="/painel-institucional"><Send size={16}/> Publicar edital</Link> : <span className="badge">Consulta pública</span>}/>

    <div className="statGrid">
      <StatCard label="Publicados" value={String(editais.length)} foot="Disponíveis na base" icon={Pin}/>
      <StatCard label="Em andamento" value={String(open)} foot="Sem prazo vencido" icon={FileCheck2}/>
      <StatCard label="Encerram em 14 dias" value={String(endingSoon)} foot="Acompanhe os prazos" icon={TimerReset}/>
      <StatCard label="Atualização" value="Tempo real" foot="Painel institucional" icon={CalendarClock}/>
    </div>

    <SectionTitle title="Editais publicados" description="Abra qualquer item para consultar texto, prazo, local e link oficial quando informado."/>
    {editais.length === 0 ? <div className="emptyState card"><Pin size={28}/><h2>Nenhum edital publicado</h2><p>Os próximos editais aparecerão aqui assim que forem publicados pela instituição.</p></div> : <div className="publicationGrid">
      {editais.map((row) => <Link className="card publicationCard" href={`/publicacoes/${row.id}`} key={row.id}>
        <div className="publicationCardHead"><span className="badge">{row.referenceCode || "Edital"}</span><time>{formatDate(row.publishedAt)}</time></div>
        <h2>{row.title}</h2><p>{row.summary || "Abra para consultar os detalhes deste edital."}</p>
        <div className="publicationCardFoot"><span><CalendarClock size={15}/>{row.endsAt ? `Prazo: ${formatDate(row.endsAt)}` : "Prazo não informado"}</span><strong>Consultar →</strong></div>
      </Link>)}
    </div>}
  </>;
}
