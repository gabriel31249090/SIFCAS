import { Bell, BookOpenCheck, Bug, CalendarDays, FileCheck2, Files, Link2, Search, Settings2, Wrench } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Solicitações e atendimento", description: "Abra e acompanhe demandas acadêmicas, administrativas, TI, infraestrutura e transporte.", icon: Wrench, badge: "atendimento", href: "/solicitacoes" },
  { title: "Base de conhecimento", description: "Tutoriais rápidos para resolver dúvidas comuns antes de abrir um chamado.", icon: BookOpenCheck, badge: "autoatendimento", href: "/base-conhecimento" },
  { title: "Meus atalhos", description: "Monte seu conjunto pessoal de acessos rápidos aos módulos mais usados.", icon: Link2, badge: "personalização", href: "/atalhos" },
  { title: "Preferências de notificações", description: "Escolha quais categorias podem gerar novos avisos para sua conta.", icon: Settings2, badge: "preferências", href: "/preferencias-notificacoes" },
  { title: "Reportar erro", description: "Registre um problema do SIFCAS e acompanhe o andamento da correção.", icon: Bug, badge: "qualidade", href: "/reportar-erro" },
  { title: "Documentos acadêmicos", description: "Emitir declaração, histórico e documentos acadêmicos disponíveis.", icon: Files, badge: "documentos", href: "/documentos-academicos" },
  { title: "Verificar documento", description: "Validação pública por código de autenticidade.", icon: FileCheck2, badge: "público", href: "/verificar-documento" },
  { title: "Agenda institucional", description: "Eventos, prazos, avisos e compromissos oficiais.", icon: CalendarDays, badge: "agenda", href: "/agenda-institucional" },
  { title: "Notificações", description: "Avisos direcionados ao seu papel institucional.", icon: Bell, badge: "avisos", href: "/notificacoes" },
  { title: "Busca global", description: "Localize serviços, editais, notícias, módulos e documentos.", icon: Search, badge: "busca", href: "/buscar" },
];

export default function Page() {
  return <GenericModules title="Central de Serviços" description="Catálogo de serviços funcionais do SIFCAS, agora com autoatendimento, atalhos e acompanhamento de erros inspirado nos fluxos úteis do SUAP." modules={modules}/>;
}
