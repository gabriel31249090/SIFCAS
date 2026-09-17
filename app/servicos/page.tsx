import { Bell, CalendarDays, FileCheck2, Files, Search, Wrench } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Solicitações e atendimento", description: "Abra e acompanhe demandas acadêmicas, administrativas, TI, infraestrutura e transporte.", icon: Wrench, badge: "atendimento", href: "/solicitacoes" },
  { title: "Documentos acadêmicos", description: "Emitir declaração, histórico e documentos acadêmicos disponíveis.", icon: Files, badge: "documentos", href: "/documentos-academicos" },
  { title: "Verificar documento", description: "Validação pública por código de autenticidade.", icon: FileCheck2, badge: "público", href: "/verificar-documento" },
  { title: "Agenda institucional", description: "Eventos, prazos, avisos e compromissos oficiais.", icon: CalendarDays, badge: "agenda", href: "/agenda-institucional" },
  { title: "Notificações", description: "Avisos direcionados ao seu papel institucional.", icon: Bell, badge: "avisos", href: "/notificacoes" },
  { title: "Busca global", description: "Localize serviços, editais, notícias, módulos e documentos.", icon: Search, badge: "busca", href: "/buscar" },
];

export default function Page() {
  return <GenericModules title="Central de Serviços" description="Catálogo de serviços já funcionais no SIFCAS. Cada card abaixo possui um fluxo real e um destino válido." modules={modules}/>;
}
