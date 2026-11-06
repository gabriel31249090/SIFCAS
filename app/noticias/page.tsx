import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Megaphone, Newspaper, Send, Sparkles } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { listPublishedPublications, publicationKindLabels } from "@/lib/institutional";
import { getCasNews } from "@/lib/cas-news";
import { CampusResources } from "@/components/CampusResources";

export const metadata: Metadata = {
  title: "Notícias e eventos",
  description: "Notícias, comunicados e eventos oficiais do SIFCAS e do Campus Cáceres.",
  alternates: { canonical: "/noticias" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function NewsPage() {
  const account = await getCurrentAccount();
  const [publicationResult, casNewsResult] = await Promise.allSettled([
    listPublishedPublications(["news", "notice", "event"], 100),
    getCasNews(),
  ]);
  const unavailable = publicationResult.status === "rejected";
  const publications = publicationResult.status === "fulfilled" ? publicationResult.value : [];
  const casNews = casNewsResult.status === "fulfilled"
    ? casNewsResult.value
    : { status: "unavailable" as const, items: [], skipped: 0 };
  if (casNewsResult.status === "rejected") console.error("[SIFCAS CAS feed] Unexpected feed error", casNewsResult.reason);
  const news = publications.filter((row) => row.kind === "news").length;
  const notices = publications.filter((row) => row.kind === "notice").length;
  const events = publications.filter((row) => row.kind === "event").length;
  const canPublish = !!account && account.accountStatus === "active" && ["staff", "manager", "admin"].includes(account.role);

  return <>
    <PageHeader title="Notícias e Eventos" description="Publicações do SIFCAS e notícias públicas do Campus Cáceres, com cada fonte identificada." action={canPublish ? <Link className="button soft" href="/painel-institucional"><Send size={16}/> Nova publicação</Link> : <span className="badge">Conteúdo institucional</span>}/>

    <div className="statGrid">
      <StatCard label="Publicações" value={String(publications.length)} foot="Disponíveis agora" icon={Sparkles}/>
      <StatCard label="Notícias" value={String(news)} foot="Informações institucionais" icon={Newspaper}/>
      <StatCard label="Comunicados" value={String(notices)} foot="Avisos oficiais" icon={Megaphone}/>
      <StatCard label="Eventos" value={String(events)} foot="Programações publicadas" icon={CalendarDays}/>
    </div>

    <SectionTitle title="Publicações recentes" description="Conteúdo oficial disponível para seu perfil ou para consulta pública."/>
    {unavailable ? <div className="infoBox" role="status">A fonte de publicações está indisponível ou sem configuração. Consulte o portal oficial e os guias abaixo.</div> : publications.length === 0 ? <div className="emptyState card"><Newspaper size={28}/><h2>Nenhuma publicação</h2><p>Quando a instituição publicar uma notícia, comunicado ou evento, ele aparecerá aqui.</p></div> : <div className="publicationGrid">
      {publications.map((row) => <Link className="card publicationCard" href={`/publicacoes/${row.id}`} key={row.id}>
        <div className="publicationCardHead"><span className="badge">{publicationKindLabels[row.kind]}</span><time>{formatDate(row.publishedAt ?? row.startsAt)}</time></div>
        <h2>{row.title}</h2><p>{row.summary || "Abra a publicação para consultar o conteúdo completo."}</p>
        <div className="publicationCardFoot"><span>{row.location || (row.kind === "event" ? "Local não informado" : "SIFCAS")}</span><strong>Abrir →</strong></div>
      </Link>)}
    </div>}
    <SectionTitle title="Notícias do Campus Cáceres" description="Feed público do portal oficial do campus. As matérias e os prazos devem ser confirmados na publicação original."/>
    {casNews.status === "unavailable"
      ? <div className="infoBox" role="status">Não foi possível consultar o feed público do Campus Cáceres agora. <a href="https://cas.ifmt.edu.br/" target="_blank" rel="noopener noreferrer">Abrir o portal oficial</a>.</div>
      : casNews.status === "partial" && <div className="infoBox" role="status">Algumas publicações do feed vieram incompletas e foram ignoradas ({casNews.skipped}). Os itens disponíveis abaixo apontam para a fonte oficial.</div>}
    {casNews.status !== "unavailable" && (casNews.items.length
      ? <div className="publicationGrid">{casNews.items.map((item) => <a className="card publicationCard" href={item.url} key={item.id} target="_blank" rel="noopener noreferrer">
        <div className="publicationCardHead"><span className="badge">Campus Cáceres</span><time dateTime={item.publishedOn}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${item.publishedOn}T12:00:00Z`))}</time></div>
        <h2>{item.title}</h2><p>Publicação do portal oficial do Campus Cáceres.</p>
        <div className="publicationCardFoot"><span>Fonte oficial</span><strong>Ler notícia <ArrowUpRight size={14} aria-hidden="true"/></strong></div>
      </a>)}</div>
      : <div className="infoBox">Nenhuma notícia pública foi retornada pelo feed. <a href="https://cas.ifmt.edu.br/" target="_blank" rel="noopener noreferrer">Consultar o portal oficial</a>.</div>)}
    <CampusResources title="Acompanhe o IFMT Cáceres" slugs={["noticias-campus", "editais-oficiais", "calendario-academico"]}/>
  </>;
}
