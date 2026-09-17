import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, FileText, MapPin, Newspaper, Pin, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { getPublicationById, publicationKindLabels, publicationStatusLabels } from "@/lib/institutional";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

const kindIcons = { news: Newspaper, notice: ShieldCheck, edital: Pin, event: CalendarDays } as const;

export default async function PublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [publication, account] = await Promise.all([getPublicationById(id), getCurrentAccount()]);
  if (!publication) notFound();
  const Icon = kindIcons[publication.kind];
  const canManage = !!account && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader
      title={publication.title}
      description={`${publicationKindLabels[publication.kind]}${publication.referenceCode ? ` • ${publication.referenceCode}` : ""}`}
      action={<div className="publicationHeaderActions">{publication.status !== "published" && <span className="badge">{publicationStatusLabels[publication.status]}</span>}{canManage && <Link className="button soft" href="/painel-institucional">Gerenciar</Link>}</div>}
    />

    <article className="card publicationDetail">
      <header className="publicationDetailHeader"><span className="iconBox"><Icon size={21}/></span><div><span className="badge">{publicationKindLabels[publication.kind]}</span><small>Publicado em {formatDate(publication.publishedAt ?? publication.createdAt)}</small></div></header>

      {publication.summary && <p className="publicationLead">{publication.summary}</p>}

      <div className="publicationMetaGrid">
        {(publication.startsAt || publication.endsAt) && <div><CalendarDays size={17}/><span><b>Data / prazo</b><small>{publication.startsAt ? `Início: ${formatDate(publication.startsAt)}` : ""}{publication.startsAt && publication.endsAt ? " • " : ""}{publication.endsAt ? `Fim: ${formatDate(publication.endsAt)}` : ""}</small></span></div>}
        {publication.location && <div><MapPin size={17}/><span><b>Local</b><small>{publication.location}</small></span></div>}
        {publication.referenceCode && <div><FileText size={17}/><span><b>Referência</b><small>{publication.referenceCode}</small></span></div>}
      </div>

      {publication.content ? <section className="publicationContent"><SectionTitle title="Conteúdo"/><p>{publication.content}</p></section> : <div className="infoBox">Esta publicação não possui texto complementar.</div>}

      {publication.externalUrl && <div className="publicationExternal"><a className="button primary" href={publication.externalUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Abrir link oficial</a></div>}
    </article>
  </>;
}
