import { BadgeDollarSign, ChartNoAxesCombined, FileText, Info, Landmark, ScrollText } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Indicadores institucionais", description: "Ensino, pesquisa, extensão, pessoas e gestão.", icon: ChartNoAxesCombined, badge: "dados" },
  { title: "Orçamento", description: "Planejamento e execução de despesas.", icon: BadgeDollarSign, badge: "finanças" },
  { title: "Contratos e licitações", description: "Consultas públicas e documentos.", icon: ScrollText, badge: "compras" },
  { title: "Atos e boletins", description: "Boletins, portarias e documentos oficiais.", icon: FileText, badge: "atos" },
  { title: "Acesso à informação", description: "Canais oficiais e orientações.", icon: Info, badge: "LAI" },
  { title: "Governança", description: "Planejamento, estrutura e prestação de contas.", icon: Landmark, badge: "gestão" }
];

export default function Page() {
  return <GenericModules title="Transparência" description="Dados públicos, indicadores, contratos, orçamento, gestão, documentos e acesso à informação." modules={modules}/>;
}
