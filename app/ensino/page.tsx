import { Award, CalendarDays, CalendarRange, ChartNoAxesCombined, GraduationCap, NotebookTabs } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Cursos e matrizes", description: "Projetos pedagógicos, componentes, cargas horárias e pré-requisitos.", icon: GraduationCap, badge: "gestão" },
  { title: "Turmas e diários", description: "Conteúdo, frequência, avaliações e fechamento de diário.", icon: NotebookTabs, badge: "docente" },
  { title: "Calendário acadêmico", description: "Períodos letivos, recessos, conselhos e avaliações.", icon: CalendarDays, badge: "calendário" },
  { title: "Diplomas e certificados", description: "Registro, validação, emissão e acompanhamento.", icon: Award, badge: "certificação" },
  { title: "Desempenho acadêmico", description: "Evasão, retenção, aprovação e indicadores.", icon: ChartNoAxesCombined, badge: "indicadores" },
  { title: "Agenda das turmas", description: "Planejamento publicado pelos professores para cada turma.", icon: CalendarRange, badge: "turmas", href: "/agenda-aluno" }
];

export default function Page() {
  return <GenericModules title="Ensino" description="Central acadêmica para cursos, turmas, diários, calendários, avaliações, diplomas e acompanhamento pedagógico." modules={modules}/>;
}
