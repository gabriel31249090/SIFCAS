import type { Metadata } from "next";
import { Building2, BusFront, Library, Map, Scale, Utensils } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

export const metadata: Metadata = {
  title: "Campus Cáceres",
  description: "Informações, estrutura e serviços planejados para o Campus Cáceres no SIFCAS.",
  alternates: { canonical: "/campus" },
};

const modules = [
  { title: "Direção e setores", description: "Gestores, responsáveis, contatos e horários.", icon: Building2, badge: "planejado" },
  { title: "Base jurídica", description: "Normas, regulamentos e documentos.", icon: Scale, badge: "planejado" },
  { title: "Refeitório", description: "Cardápio, recargas e orientações.", icon: Utensils, badge: "planejado" },
  { title: "Transporte", description: "Frota, solicitações e deslocamentos.", icon: BusFront, badge: "planejado" },
  { title: "Biblioteca", description: "Catálogo, horários e serviços locais.", icon: Library, badge: "planejado" },
  { title: "Estrutura", description: "Mapa, blocos, laboratórios e espaços.", icon: Map, badge: "planejado" }
];

export default function Page() {
  return <GenericModules title="Campus Cáceres" description="Informações locais, setores, contatos, infraestrutura, administração, calendário e serviços específicos do campus." notice="Essas áreas estão no roteiro de implantação. Enquanto os dados oficiais não forem publicados, os cartões permanecem claramente sinalizados e sem ação." modules={modules}/>;
}
