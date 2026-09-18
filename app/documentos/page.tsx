import { BadgeCheck, Files, FolderKanban, GraduationCap, LayoutTemplate, PenLine, SearchCheck } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Documentos acadêmicos", description: "Emita declaração de matrícula, histórico escolar e certificado de conclusão quando elegível.", icon: GraduationCap, badge: "funcional", href: "/documentos-academicos" },
  { title: "Processos eletrônicos", description: "Abra processos, acompanhe protocolo, setor atual e histórico de tramitação.", icon: FolderKanban, badge: "funcional", href: "/processos" },
  { title: "Meus documentos", description: "Rascunhos, assinaturas e documentos emitidos.", icon: Files, badge: "documentos" },
  { title: "Assinaturas", description: "Documentos aguardando assinatura ou ciência.", icon: PenLine, badge: "planejado" },
  { title: "Validação pública", description: "Verifique a autenticidade de documentos acadêmicos por código SIF.", icon: BadgeCheck, badge: "público", href: "/verificar-documento" },
  { title: "Consulta de processo", description: "Acompanhamento de processos eletrônicos autenticados.", icon: SearchCheck, badge: "processos", href: "/processos" },
  { title: "Modelos", description: "Modelos institucionais padronizados.", icon: LayoutTemplate, badge: "planejado" }
];

export default function Page() {
  return <GenericModules title="Documentos e Processos" description="Documentos acadêmicos, validação e tramitação eletrônica em um mesmo núcleo." modules={modules}/>;
}
