import { BadgeDollarSign, Boxes, BusFront, HardHat, PackageSearch, ScrollText, Settings2 } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Gestão Acadêmica", description: "Períodos, cursos, disciplinas, turmas, horários, papéis, professores e matrículas.", icon: Settings2, badge: "gestão", href: "/gestao-academica" },
  { title: "Orçamento e finanças", description: "Execução, empenhos, pagamentos e visão consolidada.", icon: BadgeDollarSign, badge: "finanças" },
  { title: "Contratos", description: "Vigência, fiscalização e responsáveis.", icon: ScrollText, badge: "contratos" },
  { title: "Patrimônio", description: "Bens, movimentações e inventário.", icon: PackageSearch, badge: "bens" },
  { title: "Almoxarifado", description: "Estoque, requisições, entradas e saídas.", icon: Boxes, badge: "materiais" },
  { title: "Frota", description: "Veículos, motoristas, agendas e manutenção.", icon: BusFront, badge: "frota" },
  { title: "Infraestrutura", description: "Manutenção, chamados e serviços.", icon: HardHat, badge: "campus" }
];

export default function Page() {
  return <GenericModules title="Administração" description="Orçamento, contratos, patrimônio, almoxarifado, frota, compras, infraestrutura e gestão acadêmica." modules={modules}/>;
}
