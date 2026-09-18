import {
  Home, GraduationCap, BookOpen, FlaskConical, Sprout, School, Grid3X3,
  Files, Building2, Users, Pin, Newspaper, CalendarDays, CalendarRange,
  Search, UserRoundCog, Settings2, ClipboardList, Bot, BookOpenCheck, Link2, Compass, ListTodo
} from "lucide-react";

export const navigation = [
  { group: "Principal", items: [
    { href: "/", label: "Início", icon: Home },
    { href: "/maisa", label: "MAISA", icon: Bot },
    { href: "/pendencias", label: "Pendências", icon: ListTodo },
    { href: "/estudante", label: "Estudante", icon: GraduationCap },
    { href: "/ensino", label: "Ensino", icon: BookOpen },
  ]},
  { group: "Acadêmico", items: [
    { href: "/oportunidades", label: "Oportunidades", icon: Compass },
    { href: "/pesquisa", label: "Pesquisa", icon: FlaskConical },
    { href: "/extensao", label: "Extensão", icon: Sprout },
    { href: "/campus", label: "Campus Cáceres", icon: School },
    { href: "/agenda-aluno", label: "Agenda do Aluno", icon: CalendarRange },
    { href: "/gestao-academica", label: "Gestão Acadêmica", icon: Settings2 },
  ]},
  { group: "Serviços", items: [
    { href: "/servicos", label: "Serviços", icon: Grid3X3 },
    { href: "/solicitacoes", label: "Solicitações", icon: ClipboardList },
    { href: "/base-conhecimento", label: "Base de Conhecimento", icon: BookOpenCheck },
    { href: "/atalhos", label: "Meus Atalhos", icon: Link2 },
    { href: "/documentos", label: "Documentos e Processos", icon: Files },
    { href: "/administracao", label: "Administração", icon: Building2 },
    { href: "/pessoas", label: "Pessoas", icon: Users },
  ]},
  { group: "Institucional", items: [
    { href: "/editais", label: "Editais", icon: Pin },
    { href: "/noticias", label: "Notícias e Eventos", icon: Newspaper },
    { href: "/agenda-institucional", label: "Agenda Institucional", icon: CalendarDays },
    { href: "/transparencia", label: "Transparência", icon: Search },
    { href: "/perfil", label: "Perfil", icon: UserRoundCog },
  ]},
];
