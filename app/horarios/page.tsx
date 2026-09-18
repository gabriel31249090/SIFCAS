import Link from "next/link";
import { CalendarDays, Clock3, MapPin, School } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getStudentAcademicContext } from "@/lib/academic";
import { redirect } from "next/navigation";

const weekdayLabels: Record<number,string> = {1:"Segunda-feira",2:"Terça-feira",3:"Quarta-feira",4:"Quinta-feira",5:"Sexta-feira",6:"Sábado",7:"Domingo"};

export default async function SchedulesPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  const academic = await getStudentAcademicContext(account.id);

  return <>
    <PageHeader title="Locais e Horários de Aula" description="Grade semanal publicada para sua turma." action={<Link href="/disciplinas" className="button soft">Minhas disciplinas</Link>}/>
    {!academic ? <div className="infoBox">Sua conta ainda não possui matrícula ativa.</div> : <>
      <div className="statGrid">
        <StatCard label="Turma" value={academic.className} foot={academic.classCode} icon={School}/>
        <StatCard label="Aulas cadastradas" value={String(academic.schedules.length)} foot="Entradas na grade semanal" icon={Clock3}/>
        <StatCard label="Disciplinas" value={String(academic.subjects.length)} foot={academic.periodName} icon={CalendarDays}/>
        <StatCard label="Campus" value="Cáceres" foot={account.campus} icon={MapPin}/>
      </div>
      <SectionTitle title="Grade semanal" description="Horários e salas cadastrados pela gestão acadêmica."/>
      <section className="card panel">
        {academic.schedules.length === 0 ? <div className="infoBox">O horário da turma ainda não foi publicado.</div> : <div className="scheduleGrid">
          {academic.schedules.map((schedule) => <article className="scheduleCard" key={schedule.id}>
            <span>{weekdayLabels[schedule.weekday] ?? "Dia " + schedule.weekday}</span>
            <b>{schedule.startsAt.slice(0,5)} – {schedule.endsAt.slice(0,5)}</b>
            <strong>{schedule.subjectName}</strong>
            <small>{schedule.room ? "Sala/local: " + schedule.room : "Local ainda não informado"}</small>
          </article>)}
        </div>}
      </section>
    </>}
  </>;
}
