import { BadgeCheck, Files, FolderKanban, GraduationCap, LayoutTemplate, PenLine, SearchCheck } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Documentos acadêmicos", description: "Emita declaração de matrícula, histórico escolar e certificado de conclusão quando elegível.", icon: GraduationCap, badge: "funcional", href: "/documentos-academicos" },
  { title: "Meus documentos", description: "Rascunhos, assinaturas e documentos emitidos.", icon: Files, badge: "documentos" },
  { title: "Meus processos", description: "Tramitações, interessados e histórico.", icon: FolderKanban, badge: "processos" },
  { title: "Assinaturas", description: "Documentos aguardando assinatura ou ciência.", icon: PenLine, badge: "ação" },
  { title: "Validação pública", description: "Verifique a autenticidade de documentos acadêmicos por código SIF.", icon: BadgeCheck, badge: "público", href: "/verificar-documento" },
  { title: "Processo externo", description: "Consulta pública a processos eletrônicos.", icon: SearchCheck, badge: "consulta" },
  { title: "Modelos", description: "Modelos institucionais padronizados.", icon: LayoutTemplate, badge: "biblioteca" }
];

export default function Page() {
  return <GenericModules title="Documentos e Processos" description="Crie, assine, consulte, tramite e valide documentos e processos eletrônicos." modules={modules}/>;
}
