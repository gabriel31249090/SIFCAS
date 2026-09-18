import { Activity, Bell, BookOpen, BookOpenCheck, Bot, Bug, CalendarClock, CalendarDays, CalendarRange, ClipboardList, Clock3, Compass, FileCheck2, ListTodo, Files, GraduationCap, Grid3X3, Link2, Newspaper, Pin, School, Search, Settings2, ShieldCheck, UserCog, UserRoundCog } from "lucide-react";
import { ModuleCard, PageHeader, SectionTitle } from "@/components/UI";
import { getCurrentAccount } from "@/lib/auth";

export default async function AppsPage() {
  const account = await getCurrentAccount();
  const modules = [
    { title: "Notícias e eventos", description: "Publicações institucionais e atividades abertas.", icon: Newspaper, badge: "público", href: "/noticias" },
    { title: "Editais", description: "Chamadas, bolsas, seleções e oportunidades.", icon: Pin, badge: "público", href: "/editais" },
    { title: "Agenda institucional", description: "Eventos, prazos e compromissos oficiais.", icon: CalendarDays, badge: "público", href: "/agenda-institucional" },
    { title: "Campus", description: "Informações e serviços do Campus Cáceres.", icon: School, badge: "público", href: "/campus" },
    { title: "Verificar documento", description: "Validação pública por código de autenticidade.", icon: FileCheck2, badge: "público", href: "/verificar-documento" },
    { title: "Busca global", description: "Localize módulos, notícias, editais e documentos.", icon: Search, badge: "busca", href: "/buscar" },
  ];

  if (account && account.accountStatus === "active") {
    modules.push(
      { title: "MAISA", description: "Assistente inteligente do SIFCAS conectada ao Dify com sessão protegida.", icon: Bot, badge: "IA", href: "/maisa" },
      { title: "Início", description: "Resumo personalizado do seu vínculo institucional.", icon: Grid3X3, badge: "conta", href: "/" },
      { title: "Perfil", description: "Dados pessoais e segurança da conta.", icon: UserRoundCog, badge: "conta", href: "/perfil" },
      { title: "Notificações", description: "Avisos e novas publicações destinadas ao seu perfil.", icon: Bell, badge: "conta", href: "/notificacoes" },
      { title: "Central de Pendências", description: "Notificações, processos, candidaturas e prazos reunidos em uma tela.", icon: ListTodo, badge: "produtividade", href: "/pendencias" },
      { title: "Base de conhecimento", description: "Tutoriais e orientações de autoatendimento.", icon: BookOpen, badge: "ajuda", href: "/base-conhecimento" },
      { title: "Meus atalhos", description: "Personalize os acessos mais usados no painel inicial.", icon: Link2, badge: "personalização", href: "/atalhos" },
      { title: "Preferências de notificações", description: "Controle as categorias de novos avisos.", icon: Settings2, badge: "preferências", href: "/preferencias-notificacoes" },
      { title: "Reportar erro", description: "Registre um problema e acompanhe a análise.", icon: Bug, badge: "qualidade", href: "/reportar-erro" },
      { title: "Solicitações", description: "Abra e acompanhe demandas institucionais.", icon: ClipboardList, badge: "serviços", href: "/solicitacoes" },
      { title: "Documentos", description: "Documentos acadêmicos, processos e validação.", icon: Files, badge: "serviços", href: "/documentos" },
      { title: "Oportunidades", description: "Estágios, auxílios, projetos, TCC e processos institucionais.", icon: Compass, badge: "acadêmico", href: "/oportunidades" },
    );

    if (account.role === "student") modules.push(
      { title: "Área do estudante", description: "Turma, disciplinas, horários e serviços acadêmicos.", icon: GraduationCap, badge: "estudante", href: "/estudante" },
      { title: "Agenda do aluno", description: "Aulas, provas, trabalhos e avisos da turma.", icon: CalendarRange, badge: "estudante", href: "/agenda-aluno" },
      { title: "Boletim", description: "Notas e frequência lançadas no diário acadêmico.", icon: BookOpenCheck, badge: "estudante", href: "/boletim" },
      { title: "Minhas avaliações", description: "Provas, trabalhos e atividades avaliativas.", icon: CalendarClock, badge: "estudante", href: "/avaliacoes" },
      { title: "Minhas disciplinas", description: "Componentes curriculares e carga horária.", icon: BookOpen, badge: "estudante", href: "/disciplinas" },
      { title: "Horários de aula", description: "Grade semanal e locais cadastrados.", icon: Clock3, badge: "estudante", href: "/horarios" },
      { title: "Documentos acadêmicos", description: "Declaração, histórico e certificado quando elegível.", icon: FileCheck2, badge: "estudante", href: "/documentos-academicos" },
    );

    if (["teacher", "manager", "admin"].includes(account.role)) modules.push(
      { title: "Diário do professor", description: "Aulas, chamada, avaliações e notas.", icon: BookOpenCheck, badge: "docente", href: "/diario-professor" },
      { title: "Agenda das turmas", description: "Planejamento acadêmico e publicações para turmas.", icon: CalendarRange, badge: "docente", href: "/agenda-aluno" },
    );

    if (["staff", "manager", "admin"].includes(account.role)) modules.push(
      { title: "Painel institucional", description: "Publique notícias, editais, eventos, comunicados e anexos.", icon: ShieldCheck, badge: "servidor", href: "/painel-institucional" },
      { title: "Diretório de pessoas", description: "Professores, servidores, gestores e contatos.", icon: UserRoundCog, badge: "interno", href: "/pessoas" },
    );

    if (["manager", "admin"].includes(account.role)) modules.push(
      { title: "Gestão acadêmica", description: "Cursos, turmas, vínculos, horários e matrículas.", icon: Settings2, badge: "gestão", href: "/gestao-academica" },
      { title: "Auditoria", description: "Rastreabilidade das alterações críticas.", icon: FileCheck2, badge: "gestão", href: "/auditoria" },
      { title: "Monitoramento", description: "Saúde do sistema, banco, Storage e MAISA.", icon: Activity, badge: "gestão", href: "/monitoramento" },
    );

    if (account.role === "admin") modules.push(
      { title: "Usuários e permissões", description: "Papéis e suspensão/reativação de contas.", icon: UserCog, badge: "ADM", href: "/usuarios" },
    );
  }

  return <>
    <PageHeader title="Aplicativos SIFCAS" description="Atalhos funcionais para todos os módulos disponíveis ao seu perfil."/>
    <SectionTitle title={account ? "Meus aplicativos" : "Serviços públicos"} description={account ? "A lista é adaptada ao seu papel institucional." : "Entre na sua conta para visualizar também os módulos internos."}/>
    <div className="moduleGrid">{modules.map((module) => <ModuleCard key={module.href + "-" + module.title} {...module}/>)}</div>
  </>;
}
