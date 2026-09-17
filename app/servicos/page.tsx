import { BusFront, DoorOpen, FileText, ScrollText, Vote, Wrench } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Emitir declaração", description: "Solicite declarações acadêmicas ou funcionais.", icon: FileText, badge: "documentos" },
  { title: "Abrir chamado", description: "TI, manutenção, patrimônio e infraestrutura.", icon: Wrench, badge: "suporte" },
  { title: "Reservar espaço", description: "Salas, auditórios, laboratórios e ambientes.", icon: DoorOpen, badge: "reservas" },
  { title: "Solicitar transporte", description: "Solicitação e acompanhamento institucional.", icon: BusFront, badge: "frota" },
  { title: "Consultar contrato", description: "Contratos, responsáveis, vigências e documentos.", icon: ScrollText, badge: "gestão" },
  { title: "Eleições", description: "Processos eleitorais, candidaturas e resultados.", icon: Vote, badge: "institucional" }
];

export default function Page() {
  return <GenericModules title="Central de Serviços" description="Um catálogo único para localizar qualquer serviço acadêmico, administrativo ou institucional." modules={modules}/>;
}
