import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, ClipboardCheck, GraduationCap } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getStudentAcademicContext } from "@/lib/academic";
import { getStudentReport } from "@/lib/diary";

function formatMetric(value: number | null, suffix = "") {
  return value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${suffix}`;
}

export default async function BoletimPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  const academic = await getStudentAcademicContext(account.id);

  if (!academic) {
    return <>
      <PageHeader title="Boletim e Frequência" description="Notas e presença são exibidas a partir da sua matrícula real no SIFCAS."/>
      <section className="card panel"><div className="infoBox">Sua conta ainda não possui matrícula ativa vinculada.</div></section>
    </>;
  }

  const report = await getStudentReport(account.id, academic.classId);

  return <>
    <PageHeader
      title="Boletim e Frequência"
      description={`${academic.courseName} • ${academic.className} • ${academic.periodName}`}
      action={<Link href="/agenda-aluno" className="button soft">Abrir agenda</Link>}
    />

    <div className="statGrid">
      <StatCard label="Média geral" value={formatMetric(report.overallAverage10)} foot="Escala equivalente de 0 a 10" icon={BarChart3}/>
      <StatCard label="Frequência geral" value={formatMetric(report.overallFrequency, "%")} foot="Com base nas chamadas lançadas" icon={Activity}/>
      <StatCard label="Faltas" value={String(report.totalAbsences)} foot="Registros de ausência" icon={ClipboardCheck}/>
      <StatCard label="Disciplinas" value={String(report.rows.length)} foot={academic.className} icon={GraduationCap}/>
    </div>

    <SectionTitle title="Desempenho por disciplina" description="O cálculo considera somente avaliações e chamadas efetivamente lançadas pelos professores."/>
    <section className="card panel">
      {report.rows.length === 0 ? <div className="infoBox">Nenhum componente curricular disponível para o boletim.</div> : <div className="tableScroll"><table className="dataTable"><thead><tr>
        <th>Disciplina</th><th>Média</th><th>Frequência</th><th>Faltas</th><th>Avaliações lançadas</th><th>Chamadas</th>
      </tr></thead><tbody>
        {report.rows.map((row) => <tr key={row.classSubjectId}>
          <td><b>{row.subjectName}</b><br/><small>{row.subjectCode}</small></td>
          <td>{formatMetric(row.average10)}</td>
          <td>{formatMetric(row.frequency, "%")}</td>
          <td>{row.absences}</td>
          <td>{row.gradedAssessments}</td>
          <td>{row.attendanceRecords}</td>
        </tr>)}
      </tbody></table></div>}
    </section>

    <div className="infoBox" style={{ marginTop: 18 }}>
      Enquanto uma disciplina não tiver notas ou chamadas registradas, o SIFCAS mostra “—” em vez de criar valores fictícios.
    </div>
  </>;
}
