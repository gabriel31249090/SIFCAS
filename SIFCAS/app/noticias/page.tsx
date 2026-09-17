import { CalendarDays, FlaskConical, Megaphone, Newspaper, School, Sprout } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules = [
  { title: "Notícias do IFMT", description: "Publicações e comunicados institucionais.", icon: Newspaper, badge: "geral" },
  { title: "Campus Cáceres", description: "Notícias e atividades locais.", icon: School, badge: "campus" },
  { title: "Eventos", description: "Programação institucional e acadêmica.", icon: CalendarDays, badge: "agenda" },
  { title: "Comunicados", description: "Avisos oficiais importantes.", icon: Megaphone, badge: "oficial" },
  { title: "Ciência e inovação", description: "Destaques de pesquisa e tecnologia.", icon: FlaskConical, badge: "pesquisa" },
  { title: "Extensão e comunidade", description: "Ações com participação da sociedade.", icon: Sprout, badge: "extensão" }
];

export default function Page() {
  return <GenericModules title="Notícias e Eventos" description="Conteúdo institucional geral e do Campus Cáceres, sem precisar trocar de portal." modules={modules}/>;
}
