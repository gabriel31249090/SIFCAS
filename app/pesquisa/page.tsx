import { Award, ChartNoAxesCombined, ClipboardCheck, FlaskConical, Link, Pin } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Projetos de pesquisa", description: "Submissão, publicação, execução e candidaturas de estudantes.", icon: FlaskConical, badge: "funcional", href: "/projetos?eixo=research" },
  { title: "Editais de pesquisa", description: "Chamadas e oportunidades institucionais vinculáveis aos projetos.", icon: Pin, badge: "editais", href: "/editais" },
  { title: "Laboratórios", description: "Inventário, responsáveis, disponibilidade e reservas.", icon: FlaskConical, badge: "planejado" },
  { title: "Pareceres", description: "Cadastro de pareceristas e avaliação técnica.", icon: ClipboardCheck, badge: "planejado" },
  { title: "Currículo Lattes", description: "Integração de produção científica e indicadores.", icon: Link, badge: "integração futura" },
  { title: "Indicadores", description: "Produção por campus, servidor, área e período.", icon: ChartNoAxesCombined, badge: "próxima etapa" },
  { title: "Resultados e certificados", description: "Resultados, declarações e certificações.", icon: Award, badge: "documentos" }
];

export default function Page() {
  return <GenericModules title="Pesquisa e Inovação" description="Projetos, editais e produção científica conectados à base institucional do SIFCAS." modules={modules}/>;
}
