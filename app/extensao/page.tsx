import { Award, BriefcaseBusiness, CalendarCheck, ChartNoAxesCombined, MessageSquareMore, Sprout } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Projetos de extensão", description: "Submissão, execução e candidaturas em ações de extensão.", icon: Sprout, badge: "funcional", href: "/projetos?eixo=extension" },
  { title: "Estágios", description: "Vagas, inscrições e acompanhamento de prática profissional.", icon: BriefcaseBusiness, badge: "funcional", href: "/estagios" },
  { title: "Demandas da comunidade", description: "Registro e acompanhamento de necessidades externas.", icon: MessageSquareMore, badge: "planejado" },
  { title: "Eventos", description: "Inscrições, submissões e certificados.", icon: CalendarCheck, badge: "planejado" },
  { title: "Indicadores", description: "Público atendido, ações e resultados.", icon: ChartNoAxesCombined, badge: "próxima etapa" },
  { title: "Certificados", description: "Emissão e validação das atividades.", icon: Award, badge: "documentos" }
];

export default function Page() {
  return <GenericModules title="Extensão" description="Projetos, estágio, ações comunitárias e relacionamento com a sociedade em uma estrutura integrada." modules={modules}/>;
}
