import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pin, Search } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { filterPublicNotices, noticeStatusLabels } from "@/lib/public-notices";
import { publicNoticeSources } from "@/lib/public-notices-data";
import { loadPublicNoticeCatalog } from "@/lib/public-notices-server";
import { NoticeCards } from "./NoticeCards";
import styles from "./editais.module.css";
import { CampusResources } from "@/components/CampusResources";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Central de editais", description: "Editais do IFMT com fontes oficiais, revisão editorial, retificações e filtros por campus. Consulta pública no projeto SIFCAS.",
  alternates: { canonical: "/editais" },
};

type Params = Record<string, string | string[] | undefined>;
function scalar(value: Params[string], fallback = "") { return typeof value === "string" ? value.slice(0, 100) : fallback; }

export default async function EditaisPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const filters = { q: scalar(params.q), campus: scalar(params.campus, "Cáceres"), category: scalar(params.tema), year: scalar(params.ano), status: scalar(params.status) };
  const catalog = await loadPublicNoticeCatalog();
  const now = new Date();
  const notices = filterPublicNotices(catalog.notices, filters, now);
  const campuses = [...new Set(catalog.notices.map((notice) => notice.campus))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const categories = [...new Set(catalog.notices.map((notice) => notice.category))].sort();
  const years = [...new Set(catalog.notices.map((notice) => notice.year))].sort((a, b) => b - a);

  return <>
    <PageHeader title="Central de editais" description="Consulte oportunidades, acompanhe retificações e abra os documentos na fonte oficial." action={<a className="button soft" href="https://ifmt.edu.br/painel-de-editais/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Painel oficial do IFMT</a>}/>
    <div className="infoBox" role="note">O SIFCAS é um projeto de portal e não se apresenta como portal oficial do IFMT. Este catálogo reúne metadados revisados; inscrições, requisitos e documentos válidos permanecem na origem.</div>
    <div className={styles.sourceStatus} role="status">
      <strong>Revisão editorial · sem coleta automática</strong>
      <span>Fontes do catálogo conferidas em 03/11/2026. Prazos antigos não permanecem abertos automaticamente.</span>
      {catalog.editorialStatus === "unavailable" && <span>A fonte editorial do banco está indisponível. O catálogo revisado abaixo foi preservado; confirme novas atualizações no painel oficial.</span>}
      {catalog.editorialStatus === "unconfigured" && <span>A conexão editorial com o banco aguarda configuração. O catálogo público revisado continua disponível.</span>}
    </div>

    <section className={`card panel ${styles.filters}`} aria-label="Filtrar editais">
      <form method="get" action="/editais" className="formStack">
        <div className={styles.filterGrid}>
          <label>Texto ou número<input type="search" name="q" maxLength={100} defaultValue={filters.q} placeholder="Ex.: 39/2026, extensão"/></label>
          <label>Campus<select name="campus" defaultValue={filters.campus}><option value="all">Todos os campi</option>{campuses.map((campus) => <option key={campus}>{campus}</option>)}</select></label>
          <label>Tema<select name="tema" defaultValue={filters.category}><option value="">Todos os temas</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Ano<select name="ano" defaultValue={filters.year}><option value="">Todos os anos</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label>Situação<select name="status" defaultValue={filters.status}><option value="">Todas as situações</option>{Object.entries(noticeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className={styles.actions}><button className="button primary" type="submit"><Search size={16}/> Aplicar filtros</button><Link className="button soft" href="/editais">Limpar filtros</Link><Link className="button soft" href="/agenda-institucional">Agenda institucional</Link></div>
      </form>
    </section>

    <SectionTitle title="Editais encontrados" description={`${notices.length} resultado(s). Cáceres é o campus selecionado por padrão; outros campi estão no filtro.`}/>
    {notices.length ? <NoticeCards notices={notices} now={now.toISOString()}/> : <div className="emptyState card"><Pin size={28}/><h2>Nenhum edital para estes filtros</h2><p>Altere a busca ou consulte o painel oficial para novos editais.</p></div>}

    <SectionTitle title="Fontes e revisão" description="A consulta dos links é pública. A automação depende de formato documentado, permissão e revisão da fonte."/>
    <section className="card panel"><ul className={styles.sources}>{publicNoticeSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title} ↗</strong></a><p>{source.mode}. {source.pending}</p></li>)}</ul>
      <p>Cadastro editorial: responsáveis com acesso podem registrar editais públicos e seu link oficial no <Link href="/painel-institucional">Painel Institucional</Link>. Publicações restritas e rascunhos não entram nesta central.</p>
    </section>
    <CampusResources title="Seleções e apoio ao estudante" slugs={["editais-oficiais", "assistencia-estudantil", "estagio"]}/>
  </>;
}
