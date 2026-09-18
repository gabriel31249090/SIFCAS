import Link from "next/link";
import { BookOpen, Clock3, GraduationCap } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getStudentAcademicContext } from "@/lib/academic";
import { redirect } from "next/navigation";

export default async function SubjectsPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  const academic = await getStudentAcademicContext(account.id);

  return <>
    <PageHeader title="Minhas Disciplinas" description="Componentes curriculares vinculados à sua matrícula ativa." action={<Link href="/horarios" className="button soft">Ver horários</Link>}/>
    {!academic ? <div className="infoBox">Sua conta ainda não possui matrícula ativa.</div> : <>
      <div className="statGrid">
        <StatCard label="Curso" value={academic.courseCode || "Ativo"} foot={academic.courseName} icon={GraduationCap}/>
        <StatCard label="Turma" value={academic.className} foot={academic.periodName} icon={BookOpen}/>
        <StatCard label="Disciplinas" value={String(academic.subjects.length)} foot="Componentes ativos" icon={BookOpen}/>
        <StatCard label="Horários" value={String(academic.schedules.length)} foot="Aulas semanais cadastradas" icon={Clock3}/>
      </div>
      <SectionTitle title="Componentes curriculares" description="Carga horária e código de cada disciplina."/>
      <section className="card panel">
        {academic.subjects.length === 0 ? <div className="infoBox">Nenhuma disciplina vinculada à sua turma.</div> : <div className="stackList">
          {academic.subjects.map((subject) => <div key={subject.id}><b>{subject.name}</b><span>{subject.code} • {subject.workloadHours} horas</span></div>)}
        </div>}
      </section>
    </>}
  </>;
}
