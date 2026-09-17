import { Building2, BusFront, Library, Map, Scale, Utensils } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Direção e setores", description: "Gestores, responsáveis, contatos e horários.", icon: Building2, badge: "institucional" },
  { title: "Base jurídica", description: "Normas, regulamentos e documentos.", icon: Scale, badge: "normas" },
  { title: "Refeitório", description: "Cardápio, recargas e orientações.", icon: Utensils, badge: "serviço" },
  { title: "Transporte", description: "Frota, solicitações e deslocamentos.", icon: BusFront, badge: "serviço" },
  { title: "Biblioteca", description: "Catálogo, horários e serviços locais.", icon: Library, badge: "serviço" },
  { title: "Estrutura", description: "Mapa, blocos, laboratórios e espaços.", icon: Map, badge: "campus" }
];

export default function Page() {
  return <GenericModules title="Campus Cáceres" description="Informações locais, setores, contatos, infraestrutura, administração, calendário e serviços específicos do campus." modules={modules}/>;
}
