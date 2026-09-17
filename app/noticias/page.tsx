import Link from "next/link";
import { CalendarDays, Megaphone, Newspaper, Send, Sparkles } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { listPublishedPublications, publicationKindLabels } from "@/lib/institutional";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function NewsPage() {
  const account = await getCurrentAccount();
  const publications = await listPublishedPublications(["news", "notice", "event"], 100);
  const news = publications.filter((row) => row.kind === "news").length;
  const notices = publications.filter((row) => row.kind === "notice").length;
  const events = publications.filter((row) => row.kind === "event").length;
  const canPublish = !!account && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader title="Notícias e Eventos" description="Notícias, comunicados e eventos institucionais publicados em uma única fonte do SIFCAS." action={canPublish ? <Link className="button soft" href="/painel-institucional"><Send size={16}/> Nova publicação</Link> : <span className="badge">Conteúdo institucional</span>}/>

    <div className="statGrid">
      <StatCard label="Publicações" value={String(publications.length)} foot="Disponíveis agora" icon={Sparkles}/>
      <StatCard label="Notícias" value={String(news)} foot="Informações institucionais" icon={Newspaper}/>
      <StatCard label="Comunicados" value={String(notices)} foot="Avisos oficiais" icon={Megaphone}/>
      <StatCard label="Eventos" value={String(events)} foot="Programações publicadas" icon={CalendarDays}/>
    </div>

    <SectionTitle title="Publicações recentes" description="Conteúdo oficial disponível para seu perfil ou para consulta pública."/>
    {publications.length === 0 ? <div className="emptyState card"><Newspaper size={28}/><h2>Nenhuma publicação</h2><p>Quando a instituição publicar uma notícia, comunicado ou evento, ele aparecerá aqui.</p></div> : <div className="publicationGrid">
      {publications.map((row) => <Link className="card publicationCard" href={`/publicacoes/${row.id}`} key={row.id}>
        <div className="publicationCardHead"><span className="badge">{publicationKindLabels[row.kind]}</span><time>{formatDate(row.publishedAt ?? row.startsAt)}</time></div>
        <h2>{row.title}</h2><p>{row.summary || "Abra a publicação para consultar o conteúdo completo."}</p>
        <div className="publicationCardFoot"><span>{row.location || (row.kind === "event" ? "Local não informado" : "SIFCAS")}</span><strong>Abrir →</strong></div>
      </Link>)}
    </div>}
  </>;
}
