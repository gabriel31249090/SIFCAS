import { Award, BriefcaseBusiness, CalendarCheck, ChartNoAxesCombined, MessageSquareMore, Sprout } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Projetos de extensão", description: "Ações, equipes, metas, bolsas e resultados.", icon: Sprout, badge: "projetos" },
  { title: "Demandas da comunidade", description: "Registro e acompanhamento de necessidades externas.", icon: MessageSquareMore, badge: "comunidade" },
  { title: "Estágios", description: "Convênios, vagas, termos e avaliações.", icon: BriefcaseBusiness, badge: "estágio" },
  { title: "Eventos", description: "Inscrições, submissões e certificados.", icon: CalendarCheck, badge: "eventos" },
  { title: "Indicadores", description: "Público atendido, ações e resultados.", icon: ChartNoAxesCombined, badge: "dados" },
  { title: "Certificados", description: "Emissão e validação das atividades.", icon: Award, badge: "documentos" }
];

export default function Page() {
  return <GenericModules title="Extensão" description="Projetos, ações comunitárias, estágio, eventos e relacionamento com a sociedade." modules={modules}/>;
}
