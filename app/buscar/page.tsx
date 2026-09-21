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
  const [publications, knowledge] = await Promise.allSettled([
    query.length >= 2 ? searchAccessiblePublications(query) : Promise.resolve([]),
    activeAccount && query.length >= 2 ? listKnowledgeArticles() : Promise.resolve([]),
  ]);
  const publicationMatches = publications.status === "fulfilled" ? publications.value : [];
  const knowledgeMatches = knowledge.status === "fulfilled" ? knowledge.value.filter((article) => matchesSearch(article.title + " " + article.summary + " " + article.content, query)).slice(0, 12) : [];
  const partialError = publications.status === "rejected" || knowledge.status === "rejected";
  const total = routeMatches.length + publicationMatches.length + knowledgeMatches.length;

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

      {publicationMatches.length > 0 && <>
        <SectionTitle title="Publicações institucionais" description="Conteúdo publicado e disponível ao seu perfil."/>
        <div className="searchResults">{publicationMatches.map((publication) => <Link className="card searchResult" href={"/publicacoes/" + publication.id} key={publication.id}>
          <span className="iconBox"><FileSearch size={18}/></span><span><b>{publication.title}</b><small>{publicationKindLabels[publication.kind]}{publication.referenceCode ? " • " + publication.referenceCode : ""}{publication.summary ? " • " + publication.summary : ""}</small></span>
        </Link>)}</div>
      </>}
    </>}
  </>;
}
