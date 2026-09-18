import { Activity, BookOpenCheck, Bug, ClipboardList, FileCheck2, Megaphone, ShieldCheck, UserCog, Users } from "lucide-react";
import { GenericModules, type Module } from "@/components/GenericModules";
import { requireAccount } from "@/lib/auth";

export default async function AdministrationPage() {
  const account = await requireAccount();
  const modules: Module[] = [
    { title: "Painel Institucional", description: "Notícias, editais, eventos, comunicados, anexos e notificações.", icon: Megaphone, badge: "publicação", href: "/painel-institucional" },
    { title: "Solicitações", description: "Fila de atendimento acadêmico, administrativo, TI e infraestrutura.", icon: ClipboardList, badge: "atendimento", href: "/solicitacoes" },
    { title: "Erros reportados", description: "Acompanhe relatos de falhas enviados pelos usuários do SIFCAS.", icon: Bug, badge: "qualidade", href: "/reportar-erro" },
    { title: "Diretório de Pessoas", description: "Professores, servidores, gestores, contatos e campus.", icon: Users, badge: "pessoas", href: "/pessoas" },
  ];

  if (["manager", "admin"].includes(account.role)) {
    modules.unshift({ title: "Gestão Acadêmica", description: "Períodos, cursos, disciplinas, turmas, horários, professores e matrículas.", icon: BookOpenCheck, badge: "acadêmico", href: "/gestao-academica" });
    modules.push({ title: "Auditoria", description: "Rastreabilidade de alterações críticas no sistema.", icon: FileCheck2, badge: "controle", href: "/auditoria" });
    modules.push({ title: "Monitoramento", description: "Saúde do banco, Storage, atendimento e checklist de produção.", icon: Activity, badge: "produção", href: "/monitoramento" });
  }
  if (account.role === "admin") {
    modules.push({ title: "Usuários e Permissões", description: "Papéis, suspensão/reativação e proteção do Administrador Geral.", icon: UserCog, badge: "ADM", href: "/usuarios" });
  }

  modules.push({ title: "Documentos Acadêmicos", description: "Emissão, validação e consulta de documentos acadêmicos.", icon: ShieldCheck, badge: "documentos", href: "/documentos-academicos" });

  return <GenericModules title="Administração" description="Operações administrativas implementadas no SIFCAS, apresentadas conforme as permissões da sua conta." modules={modules}/>;
}
