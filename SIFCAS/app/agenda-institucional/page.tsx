import { CalendarDays, Clock3, Users, Megaphone } from "lucide-react";
import { PageHeader, StatCard } from "@/components/UI";

const events = [
  ["18/09", "08:00", "Reunião do Conselho de Campus", "Direção-Geral", "Sala de reuniões", "Gestão"],
  ["19/09", "09:00", "Mostra de Pesquisa e Inovação", "Coordenação de Pesquisa", "Auditório", "Evento"],
  ["22/09", "23:59", "Prazo final para submissão de projetos", "Pró-Reitoria de Pesquisa", "Online", "Prazo"],
  ["24/09", "09:00", "Feira de Extensão", "Coordenação de Extensão", "Pátio central", "Evento"],
];

export default function AgendaInstitucional() {
  return <>
    <PageHeader title="Agenda Institucional" description="Calendário oficial do IFMT e do Campus Cáceres com eventos, reuniões, prazos, feriados acadêmicos, solenidades e atividades abertas."/>
    <div className="statGrid"><StatCard label="Eventos no mês" value="18" icon={CalendarDays}/><StatCard label="Prazos institucionais" value="7" icon={Clock3}/><StatCard label="Reuniões" value="6" icon={Users}/><StatCard label="Eventos públicos" value="5" icon={Megaphone}/></div>
    <div className="sectionTitle"><div><h2>Próximos compromissos</h2><p>Agenda consolidada da instituição e do campus.</p></div></div>
    <div style={{overflowX:'auto'}}><table className="dataTable"><thead><tr><th>Data</th><th>Horário</th><th>Evento</th><th>Responsável</th><th>Local</th><th>Categoria</th></tr></thead><tbody>{events.map(e=><tr key={e[2]}>{e.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div>
  </>;
}
