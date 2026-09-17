import { Award, ChartNoAxesCombined, ClipboardCheck, FlaskConical, Link, Pin } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Editais de pesquisa", description: "Submissão, avaliação e acompanhamento de projetos.", icon: Pin, badge: "editais" },
  { title: "Laboratórios", description: "Inventário, responsáveis, disponibilidade e reservas.", icon: FlaskConical, badge: "estrutura" },
  { title: "Pareceres", description: "Cadastro de pareceristas e avaliação técnica.", icon: ClipboardCheck, badge: "avaliação" },
  { title: "Currículo Lattes", description: "Integração de produção científica e indicadores.", icon: Link, badge: "integração" },
  { title: "Indicadores", description: "Produção por campus, servidor, área e período.", icon: ChartNoAxesCombined, badge: "dados" },
  { title: "Resultados e certificados", description: "Resultados, declarações e certificações.", icon: Award, badge: "documentos" }
];

export default function Page() {
  return <GenericModules title="Pesquisa e Inovação" description="Projetos, editais, laboratórios, produção científica, pareceres e indicadores em um mesmo espaço." modules={modules}/>;
}
