import { BadgeDollarSign, BarChart3, BriefcaseBusiness, CalendarDays, FileText, Library } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Boletim e histórico", description: "Notas, conceitos, frequência e histórico escolar consolidado.", icon: BarChart3, badge: "acadêmico" },
  { title: "Horários e calendário", description: "Aulas, avaliações, prazos, recessos e eventos.", icon: CalendarDays, badge: "rotina" },
  { title: "Declarações e certificados", description: "Solicite e acompanhe documentos acadêmicos.", icon: FileText, badge: "documentos" },
  { title: "Estágios", description: "Vagas, termos, avaliações e acompanhamento.", icon: BriefcaseBusiness, badge: "oportunidades" },
  { title: "Bolsas e auxílios", description: "Editais, inscrições, resultados e benefícios.", icon: BadgeDollarSign, badge: "assistência" },
  { title: "Biblioteca", description: "Empréstimos, renovações, catálogo e pendências.", icon: Library, badge: "biblioteca" }
];

export default function Page() {
  return <GenericModules title="Área do Estudante" description="Vida acadêmica, documentos, frequência, horários, oportunidades e serviços pessoais reunidos em um único painel." modules={modules}/>;
}
