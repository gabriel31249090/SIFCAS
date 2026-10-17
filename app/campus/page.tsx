import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, GraduationCap, LibraryBig, Monitor, Search, Users } from "lucide-react";
import { CampusCard } from "@/components/CampusResources";
import { campusCategories, campusEntries, campusReviewLabel, findCampusEntries } from "@/lib/campus-content";
import styles from "./campus.module.css";

export const metadata: Metadata = {
  title: "Campus Cáceres",
  description: "Cursos, contatos, calendário e guias do SUAP e AVA do IFMT Cáceres, com fontes oficiais.",
  alternates: { canonical: "/campus" },
};

const shortcuts = [
  { href: "/campus/suap", title: "Acessar o SUAP", detail: "Matrícula, notas e documentos", icon: Monitor },
  { href: "/campus/ava-moodle", title: "Entrar no AVA", detail: "Materiais e atividades", icon: Monitor },
  { href: "/campus/calendario-academico", title: "Calendário 2026", detail: "Datas e períodos letivos", icon: CalendarDays },
  { href: "/campus?categoria=Cursos#conteudos", title: "Conhecer os cursos", detail: "Formação técnica e superior", icon: GraduationCap },
  { href: "/campus/secretaria", title: "Falar com a Secretaria", detail: "Contatos e atendimento", icon: Users },
  { href: "/campus/biblioteca", title: "Usar a biblioteca", detail: "Acervo, horários e serviços", icon: LibraryBig },
];

type Params = Promise<{ q?: string | string[]; categoria?: string | string[] }>;

export default async function CampusPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const category = campusCategories.find((item) => item === params.categoria);
  const entries = findCampusEntries(query, category);
  const categoryHref = (value?: string) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (value) search.set("categoria", value);
    return `/campus${search.size ? `?${search.toString()}` : ""}#conteudos`;
  };

  return <div className={styles.directory}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>IFMT · Prof. Olegário Baldo</span>
      <h1>Campus Cáceres</h1>
      <p>Os caminhos para a sua vida no campus, em um só lugar.</p>
      <div className={styles.heroFoot}><span>{campusEntries.length} conteúdos · Revisão em {campusReviewLabel}</span><a href="https://cas.ifmt.edu.br/" target="_blank" rel="noopener noreferrer">Portal oficial do campus <ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </header>
    <section aria-labelledby="atalhos-campus">
      <h2 id="atalhos-campus" className={styles.sectionHeading}>O que você precisa hoje?</h2>
      <div className={styles.shortcuts}>{shortcuts.map(({ href, title, detail, icon: Icon }) => <Link href={href} className={styles.shortcut} key={href}>
        <Icon size={22} aria-hidden="true"/><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true"/>
      </Link>)}</div>
    </section>
    <section id="conteudos" className={styles.catalogue} aria-labelledby="explorar-campus">
      <div className={styles.sectionHead}><div><h2 id="explorar-campus">Explore por assunto</h2><p>Cursos, serviços e orientações com acesso à fonte de cada informação.</p></div></div>
      <form action="/campus#conteudos" method="get" className={styles.search} role="search" aria-label="Buscar informações do campus">
        <label htmlFor="campus-query">Buscar no guia do campus</label>
        <div className={styles.searchRow}><input id="campus-query" name="q" defaultValue={query} maxLength={100} placeholder="Ex.: bolsa, informática, senha, biblioteca…"/>{category ? <input type="hidden" name="categoria" value={category}/> : null}<button type="submit"><Search size={18} aria-hidden="true"/> Buscar</button></div>
      </form>
      <nav aria-label="Filtrar por assunto" className={styles.filters}>
        <Link href={categoryHref()} aria-current={!category ? "page" : undefined}>Todos <span>{campusEntries.length}</span></Link>
        {campusCategories.map((item) => <Link key={item} href={categoryHref(item)} aria-current={category === item ? "page" : undefined}>{item} <span>{campusEntries.filter((entry) => entry.category === item).length}</span></Link>)}
      </nav>
      <div className={styles.resultCount}><p>{entries.length} {entries.length === 1 ? "conteúdo encontrado" : "conteúdos encontrados"}{query ? ` para “${query}”` : ""}{category ? ` em ${category}` : ""}</p>{query || category ? <Link href="/campus#conteudos">Limpar filtros</Link> : null}</div>
      {entries.length ? <div className={styles.grid}>{entries.map((entry) => <CampusCard key={entry.slug} entry={entry}/>)}</div> : <div className={styles.empty}><Search size={28} aria-hidden="true"/><h3>Nenhum conteúdo encontrado</h3><p>Tente outro termo ou limpe os filtros para ver todos os assuntos.</p><Link href="/campus#conteudos">Ver todos os conteúdos</Link></div>}
    </section>
    <p className={styles.editorialNote}>Conteúdo organizado pelo SIFCAS a partir das páginas públicas do IFMT. Consulte a fonte oficial para confirmar atualizações, prazos e condições de atendimento. Dados pessoais, notas e atividades dependem do acesso aos sistemas institucionais.</p>
  </div>;
}
