import Link from "next/link";
import { BadgeDollarSign, BarChart3, BriefcaseBusiness, CalendarDays, FileText, GraduationCap, Library, NotebookTabs } from "lucide-react";
import { ModuleCard, PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getStudentAcademicContext } from "@/lib/academic";

const shiftLabels: Record<string, string> = {
  morning: "Matutino",
  afternoon: "Vespertino",
  evening: "Noturno",
  full_time: "Integral",
  mixed: "Misto",
};

const weekdayLabels: Record<number, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
  7: "Domingo",
};

export default async function EstudantePage() {
  const account = await requireAccount();
  const academic = await getStudentAcademicContext(account.id);

  return <>
    <PageHeader
      title="Área do Estudante"
      description="Sua vida acadêmica é montada a partir da matrícula real registrada no SIFCAS."
      action={<div className="heroActions"><Link href="/boletim" className="button soft">Boletim e frequência</Link><Link href="/agenda-aluno" className="button soft">Minha agenda</Link></div>}
    />

    {!academic ? (
      <section className="card panel">
        <SectionTitle title="Nenhuma matrícula ativa" description="Sua conta existe, mas ainda não foi associada a uma turma no núcleo acadêmico."/>
        <div className="infoBox">Quando a matrícula institucional for vinculada ao seu usuário, curso, turma, disciplinas, horário, boletim e agenda aparecerão automaticamente aqui.</div>
      </section>
    ) : <>
      <div className="statGrid">
        <StatCard label="Turma" value={academic.className} foot={academic.classCode} icon={GraduationCap}/>
        <StatCard label="Curso" value={academic.courseCode || "Ativo"} foot={academic.courseName} icon={NotebookTabs}/>
        <StatCard label="Disciplinas" value={String(academic.subjects.length)} foot={academic.periodName} icon={BarChart3}/>
        <StatCard label="Turno" value={shiftLabels[academic.shift] ?? academic.shift} foot={academic.enrollmentNumber ? `Matrícula ${academic.enrollmentNumber}` : "Matrícula ativa"} icon={CalendarDays}/>
      </div>

      <div className="twoCols dashboardLower">
        <section className="card panel">
          <SectionTitle title="Minhas disciplinas" description="Componentes vinculados à sua turma."/>
          {academic.subjects.length === 0 ? <div className="infoBox">Nenhuma disciplina vinculada à turma.</div> : <div className="stackList">
            {academic.subjects.map((subject) => <div key={subject.id}><b>{subject.name}</b><span>{subject.code} • {subject.workloadHours}h</span></div>)}
          </div>}
        </section>
        <section className="card panel">
          <SectionTitle title="Horário da turma" description="Aulas cadastradas na grade semanal."/>
          {academic.schedules.length === 0 ? <div className="infoBox">O horário ainda não foi publicado.</div> : <div className="stackList">
            {academic.schedules.map((schedule) => <div key={schedule.id}><b>{weekdayLabels[schedule.weekday] ?? `Dia ${schedule.weekday}`} • {schedule.startsAt.slice(0, 5)}–{schedule.endsAt.slice(0, 5)}</b><span>{schedule.subjectName}{schedule.room ? ` • ${schedule.room}` : ""}</span></div>)}
          </div>}
        </section>
      </div>
    </>}

    <SectionTitle title="Outros serviços do estudante" description="Os módulos complementares continuam disponíveis enquanto conectamos suas bases específicas."/>
    <div className="moduleGrid">
      <ModuleCard title="Boletim e frequência" description="Notas e presença lançadas pelos professores no diário acadêmico." icon={BarChart3} badge="funcional" href="/boletim"/>
      <ModuleCard title="Declarações e certificados" description="Solicitação e acompanhamento de documentos acadêmicos." icon={FileText} badge="documentos"/>
      <ModuleCard title="Estágios" description="Vagas, termos, avaliações e acompanhamento." icon={BriefcaseBusiness} badge="oportunidades"/>
      <ModuleCard title="Bolsas e auxílios" description="Editais, inscrições, resultados e benefícios." icon={BadgeDollarSign} badge="assistência"/>
      <ModuleCard title="Biblioteca" description="Empréstimos, renovações, catálogo e pendências." icon={Library} badge="integração futura"/>
    </div>
  </>;
}
