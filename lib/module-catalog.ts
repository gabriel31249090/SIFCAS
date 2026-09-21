import type { AppRole } from "./auth";

export type ModuleIconName = "home" | "assistant" | "tasks" | "student" | "book" | "calendar" | "grades" | "clock" | "file" | "services" | "request" | "help" | "link" | "compass" | "process" | "briefcase" | "heart" | "research" | "news" | "notice" | "campus" | "search" | "profile" | "bell" | "settings" | "users" | "audit" | "activity" | "shield" | "bug";
export type ModuleGroup = "Meu espaço" | "Vida acadêmica" | "Serviços" | "Institucional" | "Gestão";
export type CampusModule = { href: string; label: string; description: string; icon: ModuleIconName; group: ModuleGroup; public?: boolean; roles?: readonly AppRole[]; navigation?: boolean; keywords?: string };

export const moduleCatalog: readonly CampusModule[] = [
  { href: "/", label: "Visão geral", description: "Sua rotina, agenda e pendências em um só lugar.", icon: "home", group: "Meu espaço", navigation: true },
  { href: "/pendencias", label: "Minhas pendências", description: "Acompanhe prazos e itens que precisam de atenção.", icon: "tasks", group: "Meu espaço", navigation: true },
  { href: "/maisa", label: "MAISA", description: "Encontre orientações e consulte seus dados com a assistente local.", icon: "assistant", group: "Meu espaço", navigation: true },
  { href: "/notificacoes", label: "Notificações", description: "Leia os avisos enviados ao seu perfil.", icon: "bell", group: "Meu espaço" },
  { href: "/perfil", label: "Meu perfil", description: "Dados pessoais, vínculo e segurança da conta.", icon: "profile", group: "Meu espaço" },
  { href: "/atalhos", label: "Meus atalhos", description: "Organize seus acessos mais usados.", icon: "link", group: "Meu espaço" },
  { href: "/preferencias-notificacoes", label: "Preferências de avisos", description: "Escolha as categorias de novas notificações.", icon: "settings", group: "Meu espaço" },
  { href: "/estudante", label: "Minha vida acadêmica", description: "Consulte sua matrícula, turma e disciplinas.", icon: "student", group: "Vida acadêmica", roles: ["student"], navigation: true },
  { href: "/boletim", label: "Boletim e frequência", description: "Notas, médias, presenças e faltas.", icon: "grades", group: "Vida acadêmica", roles: ["student"], navigation: true },
  { href: "/disciplinas", label: "Minhas disciplinas", description: "Componentes curriculares e carga horária.", icon: "book", group: "Vida acadêmica", roles: ["student"] },
  { href: "/horarios", label: "Horários de aula", description: "Sua grade semanal e as salas das aulas.", icon: "clock", group: "Vida acadêmica", roles: ["student"] },
  { href: "/avaliacoes", label: "Avaliações", description: "Provas, trabalhos e atividades avaliativas.", icon: "grades", group: "Vida acadêmica", roles: ["student"] },
  { href: "/agenda-aluno", label: "Agenda acadêmica", description: "Aulas, provas, trabalhos e avisos das turmas.", icon: "calendar", group: "Vida acadêmica", roles: ["student", "teacher", "manager", "admin"], navigation: true },
  { href: "/diario-professor", label: "Diário do professor", description: "Registre aulas, chamadas, avaliações e notas.", icon: "book", group: "Vida acadêmica", roles: ["teacher", "manager", "admin"], navigation: true },
  { href: "/ensino", label: "Ensino", description: "Organização e serviços acadêmicos.", icon: "book", group: "Vida acadêmica" },
  { href: "/oportunidades", label: "Oportunidades", description: "Estágios, auxílios, projetos e vida acadêmica.", icon: "compass", group: "Vida acadêmica", navigation: true },
  { href: "/estagios", label: "Estágios", description: "Vagas e inscrições em prática profissional.", icon: "briefcase", group: "Vida acadêmica" },
  { href: "/auxilios", label: "Auxílios estudantis", description: "Programas de assistência e inscrições.", icon: "heart", group: "Vida acadêmica" },
  { href: "/projetos", label: "Projetos", description: "Ensino, pesquisa e extensão do campus.", icon: "research", group: "Vida acadêmica" },
  { href: "/pesquisa", label: "Pesquisa", description: "Atividades e programas de pesquisa.", icon: "research", group: "Vida acadêmica" },
  { href: "/extensao", label: "Extensão", description: "Projetos e iniciativas junto à comunidade.", icon: "compass", group: "Vida acadêmica" },
  { href: "/tcc", label: "Agenda de TCC", description: "Defesas, bancas, datas e resultados.", icon: "student", group: "Vida acadêmica" },
  { href: "/servicos", label: "Central de serviços", description: "Solicitações, documentos e autoatendimento.", icon: "services", group: "Serviços", navigation: true },
  { href: "/solicitacoes", label: "Solicitações", description: "Abra e acompanhe suas demandas.", icon: "request", group: "Serviços", navigation: true },
  { href: "/documentos", label: "Documentos", description: "Documentos acadêmicos, processos e validação.", icon: "file", group: "Serviços", navigation: true },
  { href: "/documentos-academicos", label: "Documentos acadêmicos", description: "Declaração, histórico e certificado quando disponíveis.", icon: "file", group: "Serviços", roles: ["student", "manager", "admin"] },
  { href: "/processos", label: "Processos eletrônicos", description: "Protocolos, tramitações e acompanhamento.", icon: "process", group: "Serviços" },
  { href: "/base-conhecimento", label: "Central de ajuda", description: "Tutoriais e orientações de autoatendimento.", icon: "help", group: "Serviços", keywords: "senha suporte conhecimento" },
  { href: "/reportar-erro", label: "Reportar um problema", description: "Registre uma falha e acompanhe a análise.", icon: "bug", group: "Serviços" },
  { href: "/noticias", label: "Notícias e eventos", description: "Publicações e atividades institucionais.", icon: "news", group: "Institucional", public: true, navigation: true },
  { href: "/editais", label: "Editais", description: "Chamadas, bolsas, seleções e oportunidades.", icon: "notice", group: "Institucional", public: true, navigation: true, keywords: "edital" },
  { href: "/agenda-institucional", label: "Agenda do campus", description: "Eventos e compromissos institucionais.", icon: "calendar", group: "Institucional", public: true, navigation: true },
  { href: "/campus", label: "Campus Cáceres", description: "Informações e serviços do campus.", icon: "campus", group: "Institucional", public: true },
  { href: "/transparencia", label: "Transparência", description: "Informações institucionais agregadas.", icon: "shield", group: "Institucional", public: true },
  { href: "/verificar-documento", label: "Verificar documento", description: "Consulte a autenticidade pelo código SIF.", icon: "file", group: "Institucional", public: true },
  { href: "/buscar", label: "Busca global", description: "Pesquise serviços e conteúdo disponível para você.", icon: "search", group: "Institucional", public: true },
  { href: "/gestao-academica", label: "Gestão acadêmica", description: "Cursos, turmas, horários e matrículas.", icon: "settings", group: "Gestão", roles: ["manager", "admin"], navigation: true },
  { href: "/painel-institucional", label: "Publicações", description: "Gerencie notícias, editais, eventos e anexos.", icon: "news", group: "Gestão", roles: ["staff", "manager", "admin"], navigation: true },
  { href: "/administracao", label: "Administração", description: "Rotinas e serviços administrativos.", icon: "campus", group: "Gestão", roles: ["staff", "manager", "admin"] },
  { href: "/pessoas", label: "Diretório de pessoas", description: "Professores, servidores, gestores e contatos.", icon: "users", group: "Gestão", roles: ["staff", "manager", "admin"] },
  { href: "/usuarios", label: "Usuários e permissões", description: "Gerencie papéis e situação das contas.", icon: "shield", group: "Gestão", roles: ["admin"], navigation: true },
  { href: "/vinculos-institucionais", label: "Vínculos institucionais", description: "Importe e valide a base oficial de usuários.", icon: "users", group: "Gestão", roles: ["admin"], navigation: true },
  { href: "/auditoria", label: "Auditoria", description: "Acompanhe alterações críticas no sistema.", icon: "audit", group: "Gestão", roles: ["manager", "admin"] },
  { href: "/monitoramento", label: "Monitoramento", description: "Consulte a saúde dos serviços do SIFCAS.", icon: "activity", group: "Gestão", roles: ["manager", "admin"] },
];

export const moduleGroups: readonly ModuleGroup[] = ["Meu espaço", "Vida acadêmica", "Serviços", "Institucional", "Gestão"];

/** Visibility only. Server actions and database RLS remain the authorization boundary. */
export function getAccessibleModules(role: AppRole | null): CampusModule[] {
  return moduleCatalog.filter((item) => item.public || (role !== null && (!item.roles || item.roles.includes(role))));
}
