import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, FileSearch, Search } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";
import { getAccessibleModules } from "@/lib/module-catalog";
import { matchesSearch } from "@/lib/search-utils";
import { ModuleIcon } from "@/components/ModuleIcon";
import { listKnowledgeArticles } from "@/lib/experience";
import { publicationKindLabels, searchAccessiblePublications } from "@/lib/institutional";
import { loadPublicNoticeCatalog } from "@/lib/public-notices-server";
import { filterPublicNotices } from "@/lib/public-notices";
import { CampusCard } from "@/components/CampusResources";
import { findCampusEntries } from "@/lib/campus-content";

export const metadata: Metadata = {
  title: "Busca global",
  description: "Pesquise serviços, módulos e conteúdo institucional disponível no SIFCAS.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ q?: string | string[] }>;
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const account = await getCurrentAccount();
  const activeAccount = account?.accountStatus === "active" ? account : null;
  const routeMatches = query.length >= 2
    ? getAccessibleModules(activeAccount?.role ?? null).filter((item) => matchesSearch(item.label + " " + item.description + " " + (item.keywords ?? ""), query))
    : [];
  const [publications, knowledge, publicNotices] = await Promise.allSettled([
    query.length >= 2 ? searchAccessiblePublications(query) : Promise.resolve([]),
    activeAccount && query.length >= 2 ? listKnowledgeArticles() : Promise.resolve([]),
    query.length >= 2 ? loadPublicNoticeCatalog() : Promise.resolve({ notices: [], editorialStatus: "unconfigured" as const }),
  ]);
  const publicationMatches = publications.status === "fulfilled" ? publications.value : [];
  const knowledgeMatches = knowledge.status === "fulfilled" ? knowledge.value.filter((article) => matchesSearch(article.title + " " + article.summary + " " + article.content, query)).slice(0, 12) : [];
  const partialError = publications.status === "rejected" || knowledge.status === "rejected";
  const noticeMatches = publicNotices.status === "fulfilled" && query.length >= 2 ? filterPublicNotices(publicNotices.value.notices, { q: query, campus: "all" }) : [];
  const campusMatches = query.length >= 2 ? findCampusEntries(query).slice(0, 12) : [];
  const total = routeMatches.length + publicationMatches.length + knowledgeMatches.length + noticeMatches.length + campusMatches.length;

  return <>
    <PageHeader title="Busca global" description="Pesquise módulos, serviços, artigos de ajuda, editais, eventos, comunicados e notícias disponíveis para você." action={<span className="badge">{total} resultados</span>}/>

    <section className="card panel searchPageForm">
      <form action="/buscar" method="get" className="formStack">
        <label>O que você procura?
          <input name="q" defaultValue={query} placeholder="Ex.: edital, boletim, senha, avaliação, documentos..." minLength={2} maxLength={100} autoFocus/>
        </label>
        <button className="button primary" type="submit"><Search size={16}/> Buscar</button>
      </form>
    </section>

    {partialError && <div className="infoBox" role="status">Parte do conteúdo está indisponível no momento. Os atalhos continuam disponíveis; tente a busca novamente em instantes.</div>}
    {campusMatches.length > 0 && <><SectionTitle title="Guias públicos do campus" description="Orientações com fontes institucionais."/><div className="publicationGrid">{campusMatches.map((entry) => <CampusCard key={entry.slug} entry={entry}/>)}</div></>}
    {query.length < 2 ? <div className="infoBox" style={{ marginTop: 18 }}>Digite pelo menos 2 caracteres para pesquisar.</div> : total === 0 ? <div className="emptyState card"><FileSearch size={28}/><h2>Nenhum resultado</h2><p>Tente usar termos mais curtos ou o nome do módulo desejado.</p></div> : <>
      {routeMatches.length > 0 && <>
        <SectionTitle title="Aplicativos e serviços" description="Atalhos do SIFCAS relacionados à sua busca."/>
        <div className="searchResults">{routeMatches.map((result) => <Link className="card searchResult" href={result.href} key={result.href}>
          <span className="iconBox"><ModuleIcon name={result.icon} size={22}/></span><span><b>{result.label}</b><small>{result.description}</small></span>
        </Link>)}</div>
      </>}

      {knowledgeMatches.length > 0 && <>
        <SectionTitle title="Base de conhecimento" description="Orientações de autoatendimento relacionadas à sua busca."/>
        <div className="searchResults">{knowledgeMatches.map((article) => <Link className="card searchResult" href={"/base-conhecimento?q=" + encodeURIComponent(article.title)} key={article.id}>
          <span className="iconBox"><BookOpenCheck size={18}/></span><span><b>{article.title}</b><small>{article.summary}</small></span>
        </Link>)}</div>
      </>}

      {noticeMatches.length > 0 && <>
        <SectionTitle title="Central pública de editais" description="Metadados revisados, documentos e retificações com links à fonte oficial."/>
        <div className="searchResults">{noticeMatches.map((notice) => <Link className="card searchResult" href={`/editais?campus=all&q=${encodeURIComponent(`${notice.number}/${notice.year}`)}#${notice.id}`} key={notice.id}>
          <span className="iconBox"><FileSearch size={18}/></span><span><b>{notice.title}</b><small>{notice.campus} · {notice.number}/{notice.year} · {notice.summary}</small></span>
        </Link>)}</div>
      </>}

      {publicationMatches.length > 0 && <>
        <SectionTitle title="Publicações institucionais" description="Conteúdo publicado e disponível ao seu perfil."/>
        <div className="searchResults">{publicationMatches.map((publication) => <Link className="card searchResult" href={"/publicacoes/" + publication.id} key={publication.id}>
          <span className="iconBox"><FileSearch size={18}/></span><span><b>{publication.title}</b><small>{publicationKindLabels[publication.kind]}{publication.referenceCode ? " • " + publication.referenceCode : ""}{publication.summary ? " • " + publication.summary : ""}</small></span>
        </Link>)}</div>
      </>}
    </>}
  </>;
}
