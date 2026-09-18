import { BadgeDollarSign, BriefcaseBusiness, CalendarClock, FolderKanban, FlaskConical } from "lucide-react";
import { GenericModules } from "@/components/GenericModules";

const modules=[
  {title:"Estágios e Jovem Aprendiz",description:"Vagas, inscrições e acompanhamento de oportunidades profissionais.",icon:BriefcaseBusiness,badge:"carreira",href:"/estagios"},
  {title:"Auxílios Estudantis",description:"Programas de alimentação, transporte, moradia, inclusão digital e outros benefícios.",icon:BadgeDollarSign,badge:"assistência",href:"/auxilios"},
  {title:"Projetos Institucionais",description:"Ensino, Pesquisa e Extensão com submissões e candidaturas.",icon:FlaskConical,badge:"projetos",href:"/projetos"},
  {title:"Agenda de TCC",description:"Defesas, bancas, horários, locais e resultados.",icon:CalendarClock,badge:"ensino",href:"/tcc"},
  {title:"Processos Eletrônicos",description:"Demandas formalizadas com protocolo, status e histórico de tramitação.",icon:FolderKanban,badge:"protocolo",href:"/processos"},
];

export default function OpportunitiesPage(){
  return <GenericModules title="Oportunidades e Vida Acadêmica" description="Um ponto único para oportunidades, assistência estudantil, projetos, TCC e processos institucionais." modules={modules}/>;
}
