import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, GraduationCap } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getStudentAssessments } from "@/lib/experience";
import { redirect } from "next/navigation";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"medium",timeZone:"America/Cuiaba"}).format(new Date(value + "T12:00:00-04:00"));
}

export default async function AssessmentsPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  const { academic, assessments } = await getStudentAssessments(account.id);
  const today = new Date().toISOString().slice(0,10);
  const upcoming = assessments.filter((item) => item.assessmentDate >= today);
  const past = assessments.filter((item) => item.assessmentDate < today);

  return <>
    <PageHeader title="Minhas Avaliações" description="Provas, trabalhos e atividades avaliativas registradas no Diário do Professor." action={<Link href="/boletim" className="button soft">Abrir boletim</Link>}/>
    {!academic ? <div className="infoBox">Sua conta ainda não possui matrícula ativa.</div> : <>
      <div className="statGrid">
        <StatCard label="Próximas" value={String(upcoming.length)} foot="Avaliações futuras" icon={CalendarClock}/>
        <StatCard label="Realizadas" value={String(past.length)} foot="Avaliações anteriores" icon={CheckCircle2}/>
        <StatCard label="Total" value={String(assessments.length)} foot={academic.periodName} icon={ClipboardList}/>
        <StatCard label="Turma" value={academic.className} foot={academic.courseName} icon={GraduationCap}/>
      </div>

      <SectionTitle title="Próximas avaliações" description="Ordenadas pela data cadastrada pelo professor."/>
      {upcoming.length === 0 ? <div className="infoBox">Nenhuma avaliação futura cadastrada.</div> : <div className="assessmentGrid">
        {upcoming.map((item) => <article className="card assessmentCard" key={item.id}>
          <span className="badge">{formatDate(item.assessmentDate)}</span>
          <h3>{item.title}</h3>
          <b>{item.subjectName}</b>
          <p>{item.description || "Sem descrição adicional."}</p>
          <small>Valor máximo: {item.maxScore.toLocaleString("pt-BR")} • Peso: {item.weight.toLocaleString("pt-BR")}</small>
        </article>)}
      </div>}

      <SectionTitle title="Histórico de avaliações" description="Itens anteriores do período letivo."/>
      {past.length === 0 ? <div className="infoBox">Nenhuma avaliação anterior cadastrada.</div> : <div className="tableScroll"><table className="dataTable"><thead><tr><th>Data</th><th>Disciplina</th><th>Avaliação</th><th>Valor</th><th>Peso</th></tr></thead><tbody>
        {past.slice().reverse().map((item) => <tr key={item.id}><td>{formatDate(item.assessmentDate)}</td><td>{item.subjectName}</td><td>{item.title}</td><td>{item.maxScore.toLocaleString("pt-BR")}</td><td>{item.weight.toLocaleString("pt-BR")}</td></tr>)}
      </tbody></table></div>}
    </>}
  </>;
}
