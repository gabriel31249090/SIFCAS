import { BookOpenCheck, FileText, GraduationCap, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listKnowledgeArticles } from "@/lib/experience";

type Params = Promise<{ q?: string }>;

const categoryLabels: Record<string,string> = {
  general:"Geral", academic:"Acadêmico", services:"Serviços", documents:"Documentos", account:"Conta e acesso", maisa:"MAISA",
};
const categoryIcons: Record<string, typeof Search> = {
  general: Search, academic: GraduationCap, services: Wrench, documents: FileText, account: ShieldCheck, maisa: Sparkles,
};

export default async function KnowledgeBasePage({ searchParams }: { searchParams: Params }) {
  await requireAccount();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase("pt-BR");
  const articles = await listKnowledgeArticles();
  const filtered = query.length >= 2 ? articles.filter((article) => (article.title + " " + article.summary + " " + article.content).toLocaleLowerCase("pt-BR").includes(query)) : articles;

  return <>
    <PageHeader title="Base de Conhecimento" description="Tutoriais rápidos e orientações para resolver dúvidas comuns sem abrir chamado." action={<span className="badge"><BookOpenCheck size={13}/> Autoatendimento</span>}/>
    <section className="card panel searchPageForm">
      <form action="/base-conhecimento" method="get" className="formStack">
        <label>Pesquisar orientação<input name="q" defaultValue={params.q ?? ""} placeholder="Ex.: senha, boletim, documentos, MAISA..." maxLength={100}/></label>
        <button className="button primary" type="submit"><Search size={15}/> Buscar</button>
      </form>
    </section>

    <SectionTitle title="Artigos disponíveis" description={query ? "Resultados relacionados à sua pesquisa." : "Conteúdo de ajuda disponível para o seu perfil."}/>
    {filtered.length === 0 ? <div className="infoBox">Nenhum artigo encontrado.</div> : <div className="knowledgeGrid">
      {filtered.map((article) => {
        const Icon = categoryIcons[article.category] ?? Search;
        return <details className="card knowledgeArticle" key={article.id}>
          <summary><span className="iconBox"><Icon size={18}/></span><span><b>{article.title}</b><small>{categoryLabels[article.category] ?? article.category} • {article.summary}</small></span></summary>
          <div className="knowledgeContent"><p>{article.content}</p></div>
        </details>;
      })}
    </div>}
  </>;
}
