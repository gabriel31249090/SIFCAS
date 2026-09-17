import { Brain, ChartNoAxesCombined, Clock3, HeartPulse, Plane, Users } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Diretório de pessoas", description: "Servidores, setores, cargos e contatos.", icon: Users, badge: "diretório" },
  { title: "Frequência", description: "Registros, ocorrências e acompanhamento funcional.", icon: Clock3, badge: "pessoal" },
  { title: "Programa de Gestão", description: "Planos de trabalho, entregas e PGD.", icon: ChartNoAxesCombined, badge: "PGD" },
  { title: "Desenvolvimento", description: "Capacitações e trilhas de competências.", icon: Brain, badge: "formação" },
  { title: "Saúde e qualidade de vida", description: "Ações de promoção de saúde institucional.", icon: HeartPulse, badge: "saúde" },
  { title: "Viagens", description: "Solicitações, autorizações e integrações.", icon: Plane, badge: "gestão" }
];

export default function Page() {
  return <GenericModules title="Pessoas" description="Gestão funcional, equipes, setores, desenvolvimento, saúde e programa de gestão." modules={modules}/>;
}
