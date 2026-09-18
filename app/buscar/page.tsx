import Link from "next/link";
import { BookOpenCheck, FileSearch, Search, Sparkles } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { getCurrentAccount, type AppRole } from "@/lib/auth";
import { listKnowledgeArticles } from "@/lib/experience";
import { publicationKindLabels, searchAccessiblePublications } from "@/lib/institutional";

type SearchParams = Promise<{ q?: string }>;
type RouteResult = { href: string; label: string; description: string; public?: boolean; roles?: AppRole[] };

const routes: RouteResult[] = [
  { href: "/noticias", label: "Notícias e eventos", description: "Notícias, comunicados e eventos institucionais.", public: true },
  { href: "/editais", label: "Editais", description: "Bolsas, chamadas, seleções e oportunidades.", public: true },
  { href: "/agenda-institucional", label: "Agenda institucional", description: "Eventos, prazos e compromissos oficiais.", public: true },
  { href: "/campus", label: "Campus Cáceres", description: "Informações e serviços do campus.", public: true },
  { href: "/verificar-documento", label: "Verificar documento", description: "Consulta pública de autenticidade por código SIF.", public: true },
  { href: "/maisa", label: "MAISA", description: "Assistente inteligente integrada ao SIFCAS." },
  { href: "/pendencias", label: "Central de Pendências", description: "Itens que aguardam leitura, análise, prazo ou acompanhamento." },
  { href: "/servicos", label: "Central de Serviços", description: "Solicitações, autoatendimento, documentos e suporte." },
  { href: "/base-conhecimento", label: "Base de conhecimento", description: "Tutoriais, orientações e respostas rápidas." },
  { href: "/atalhos", label: "Meus atalhos", description: "Personalize os módulos exibidos como acesso rápido." },
  { href: "/reportar-erro", label: "Reportar erro", description: "Registre e acompanhe problemas do SIFCAS." },
  { href: "/preferencias-notificacoes", label: "Preferências de notificações", description: "Controle quais categorias podem gerar novos avisos." },
  { href: "/oportunidades", label: "Oportunidades e vida acadêmica", description: "Estágios, auxílios, projetos, TCC e processos." },
  { href: "/processos", label: "Processos eletrônicos", description: "Protocolos, tramitações e acompanhamento formal." },
  { href: "/estagios", label: "Estágios e Jovem Aprendiz", description: "Vagas e inscrições em prática profissional." },
  { href: "/auxilios", label: "Auxílios estudantis", description: "Programas de assistência estudantil e inscrições." },
  { href: "/projetos", label: "Projetos institucionais", description: "Projetos de Ensino, Pesquisa e Extensão." },
  { href: "/tcc", label: "Agenda de TCC", description: "Defesas, bancas, datas, locais e resultados." },
  { href: "/estudante", label: "Área do estudante", description: "Turma, disciplinas, horários e serviços acadêmicos.", roles: ["student"] },
  { href: "/disciplinas", label: "Minhas disciplinas", description: "Componentes curriculares, códigos e carga horária.", roles: ["student"] },
  { href: "/horarios", label: "Locais e horários de aula", description: "Grade semanal e salas da turma.", roles: ["student"] },
  { href: "/avaliacoes", label: "Minhas avaliações", description: "Provas, trabalhos e atividades avaliativas.", roles: ["student"] },
  { href: "/agenda-aluno", label: "Agenda do aluno e da turma", description: "Aulas, provas, trabalhos, materiais e avisos.", roles: ["student", "teacher", "manager", "admin"] },
  { href: "/boletim", label: "Boletim e frequência", description: "Notas, médias, presença e faltas.", roles: ["student"] },
  { href: "/diario-professor", label: "Diário do professor", description: "Conteúdo ministrado, chamada, avaliações e notas.", roles: ["teacher", "manager", "admin"] },
  { href: "/documentos-academicos", label: "Documentos acadêmicos", description: "Declaração, histórico e certificado.", roles: ["student", "manager", "admin"] },
  { href: "/gestao-academica", label: "Gestão acadêmica", description: "Cursos, turmas, vínculos, horários e matrículas.", roles: ["manager", "admin"] },
  { href: "/painel-institucional", label: "Painel institucional", description: "Publicação de notícias, editais, eventos e comunicados.", roles: ["staff", "manager", "admin"] },
  { href: "/vinculos-institucionais", label: "Vínculos Institucionais", description: "Importação, validação e aplicação da base oficial de usuários.", roles: ["admin"] },
  { href: "/notificacoes", label: "Notificações", description: "Avisos enviados ao seu perfil institucional." },
  { href: "/perfil", label: "Perfil", description: "Dados pessoais, papel institucional e segurança." },
];

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const account = await getCurrentAccount();
  const activeAccount = account?.accountStatus === "active" ? account : null;
  const normalized = query.toLocaleLowerCase("pt-BR");

  const routeMatches = query.length >= 2 ? routes.filter((route) => {
    const allowed = route.public || (activeAccount && (!route.roles || route.roles.includes(activeAccount.role)));
    if (!allowed) return false;
    return (route.label + " " + route.description).toLocaleLowerCase("pt-BR").includes(normalized);
  }) : [];

  const publicationMatches = query.length >= 2 ? await searchAccessiblePublications(query) : [];
  const knowledgeMatches = activeAccount && query.length >= 2
    ? (await listKnowledgeArticles()).filter((article) => (article.title + " " + article.summary + " " + article.content).toLocaleLowerCase("pt-BR").includes(normalized)).slice(0, 12)
    : [];
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

    {query.length < 2 ? <div className="infoBox" style={{ marginTop: 18 }}>Digite pelo menos 2 caracteres para pesquisar.</div> : total === 0 ? <div className="emptyState card"><FileSearch size={28}/><h2>Nenhum resultado</h2><p>Tente usar termos mais curtos ou o nome do módulo desejado.</p></div> : <>
      {routeMatches.length > 0 && <>
        <SectionTitle title="Aplicativos e serviços" description="Atalhos do SIFCAS relacionados à sua busca."/>
        <div className="searchResults">{routeMatches.map((result) => <Link className="card searchResult" href={result.href} key={result.href}>
          <span className="iconBox"><Sparkles size={18}/></span><span><b>{result.label}</b><small>{result.description}</small></span>
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
