import { BriefcaseBusiness, ClipboardList, FlaskConical, GraduationCap, Sprout, Users } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Auxílio Permanência", description: "Inscrições e acompanhamento de resultados.", icon: GraduationCap, badge: "aberto" },
  { title: "Projetos de Pesquisa", description: "Submissão de projetos e bolsas.", icon: FlaskConical, badge: "aberto" },
  { title: "Bolsas de Extensão", description: "Seleções e resultados de extensão.", icon: Sprout, badge: "resultado" },
  { title: "Estágios", description: "Vagas internas e externas.", icon: BriefcaseBusiness, badge: "vagas" },
  { title: "Processos seletivos", description: "Ingresso e seleções acadêmicas.", icon: ClipboardList, badge: "ingresso" },
  { title: "Concursos e seleções", description: "Oportunidades para servidores e externos.", icon: Users, badge: "público" }
];

export default function Page() {
  return <GenericModules title="Editais e Oportunidades" description="Processos seletivos, bolsas, projetos, auxílios, concursos e chamadas públicas em um único painel." modules={modules}/>;
}
