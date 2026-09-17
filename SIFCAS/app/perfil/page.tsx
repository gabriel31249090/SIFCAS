import { Accessibility, BadgeCheck, Bell, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Dados cadastrais", description: "Informações pessoais e institucionais.", icon: UserRound, badge: "perfil" },
  { title: "Vínculos", description: "Cursos, matrículas, funções e lotações.", icon: BadgeCheck, badge: "vínculos" },
  { title: "Segurança", description: "Senha, autenticação e sessões.", icon: ShieldCheck, badge: "segurança" },
  { title: "Notificações", description: "Preferências de avisos e comunicação.", icon: Bell, badge: "preferências" },
  { title: "Acessibilidade", description: "Configurações de leitura e interface.", icon: Accessibility, badge: "interface" },
  { title: "Privacidade", description: "Consentimentos e dados pessoais.", icon: LockKeyhole, badge: "LGPD" }
];

export default function Page() {
  return <GenericModules title="Perfil e Preferências" description="Dados pessoais, vínculo institucional, segurança e personalização." modules={modules}/>;
}
