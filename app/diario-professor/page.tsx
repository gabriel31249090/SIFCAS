import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, CalendarCheck2, ClipboardList, GraduationCap } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getDiaryContext } from "@/lib/diary";
import { createAssessment, createSession, saveAttendance, saveGrades } from "./actions";

type Params = Promise<{ vinculo?: string; sessao?: string; avaliacao?: string; message?: string; error?: string }>;

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(`${value}T12:00:00-04:00`));
}

const attendanceLabels: Record<string, string> = {
  present: "Presente",
  absent: "Falta",
  late: "Atraso",
  justified: "Justificada",
};

export default async function DiarioProfessorPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const context = await getDiaryContext(account, params.vinculo, params.sessao, params.avaliacao);
  const selectedSession = context.sessions.find((row) => row.id === context.selectedSessionId) ?? null;
  const selectedAssessment = context.assessments.find((row) => row.id === context.selectedAssessmentId) ?? null;

  return <>
    <PageHeader
      title="Diário do Professor"
      description="Registre conteúdo ministrado, chamada, avaliações e notas com acesso restrito aos vínculos docentes autorizados."
      action={<span className="badge">Diário acadêmico real</span>}
    />

    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    {context.options.length === 0 ? (
      <section className="card panel">
        <SectionTitle title="Nenhuma turma disponível" description="Seu usuário ainda não possui uma disciplina vinculada para uso do diário."/>
        <div className="infoBox">Um Gestor ou Administrador Geral pode criar o vínculo em Gestão Acadêmica.</div>
      </section>
    ) : <>
      <section className="card panel diarySelector">
        <form method="get" className="diaryToolbar">
          <label>Turma e disciplina
            <select name="vinculo" defaultValue={context.selected?.classSubjectId}>
              {context.options.map((option) => <option value={option.classSubjectId} key={option.classSubjectId}>{option.label}</option>)}
            </select>
          </label>
          <button className="button soft" type="submit">Abrir diário</button>
        </form>
      </section>

      <div className="statGrid">
        <StatCard label="Turma" value={context.selected?.className ?? "—"} foot={context.selected?.subjectName ?? ""} icon={GraduationCap}/>
        <StatCard label="Alunos" value={String(context.students.length)} foot="Matrículas ativas" icon={ClipboardList}/>
        <StatCard label="Aulas registradas" value={String(context.sessions.length)} foot="Últimos registros" icon={BookOpenCheck}/>
        <StatCard label="Avaliações" value={String(context.assessments.length)} foot="Na disciplina" icon={CalendarCheck2}/>
      </div>

      <div className="twoCols dashboardLower">
        <section className="card panel">
          <SectionTitle title="Registrar aula" description="Conteúdo ministrado e observações do diário."/>
          <form className="formStack" action={createSession}>
            <input type="hidden" name="classSubjectId" value={context.selected?.classSubjectId ?? ""}/>
            <div className="formRow2">
              <label>Data<input name="sessionDate" type="date" required/></label>
              <label>Início<input name="startsAt" type="time"/></label>
            </div>
            <label>Conteúdo ministrado<textarea name="content" maxLength={5000} required placeholder="Ex.: Matrizes — operações e exercícios práticos"/></label>
            <label>Observações<textarea name="notes" maxLength={5000} placeholder="Recados, ocorrências ou observações pedagógicas"/></label>
            <button className="button primary" type="submit">Registrar aula</button>
          </form>

          <SectionTitle title="Aulas recentes" description="Selecione uma aula para fazer ou revisar a chamada."/>
          {context.sessions.length === 0 ? <div className="infoBox">Nenhuma aula registrada ainda.</div> : <div className="diaryTabs">
            {context.sessions.map((session) => <Link
              key={session.id}
              className={`diaryTab ${session.id === context.selectedSessionId ? "active" : ""}`}
              href={`/diario-professor?vinculo=${context.selected?.classSubjectId}&sessao=${session.id}${context.selectedAssessmentId ? `&avaliacao=${context.selectedAssessmentId}` : ""}`}
            >
              <b>{dateLabel(session.sessionDate)}{session.startsAt ? ` • ${session.startsAt.slice(0,5)}` : ""}</b>
              <span>{session.content}</span>
            </Link>)}
          </div>}
        </section>

        <section className="card panel">
          <SectionTitle title="Criar avaliação" description="Provas, trabalhos e demais instrumentos avaliativos."/>
          <form className="formStack" action={createAssessment}>
            <input type="hidden" name="classSubjectId" value={context.selected?.classSubjectId ?? ""}/>
            <label>Título<input name="title" maxLength={180} required placeholder="Ex.: Avaliação bimestral 1"/></label>
            <div className="formRow2">
              <label>Data<input name="assessmentDate" type="date" required/></label>
              <label>Valor máximo<input name="maxScore" type="number" min="0.01" max="1000" step="0.01" defaultValue="10" required/></label>
            </div>
            <label>Peso<input name="weight" type="number" min="0.001" max="100" step="0.001" defaultValue="1" required/></label>
            <label>Descrição<textarea name="description" maxLength={5000} placeholder="Conteúdo, critérios ou observações"/></label>
            <button className="button primary" type="submit">Criar avaliação</button>
          </form>

          <SectionTitle title="Avaliações recentes" description="Selecione uma avaliação para lançar ou revisar notas."/>
          {context.assessments.length === 0 ? <div className="infoBox">Nenhuma avaliação criada ainda.</div> : <div className="diaryTabs">
            {context.assessments.map((assessment) => <Link
              key={assessment.id}
              className={`diaryTab ${assessment.id === context.selectedAssessmentId ? "active" : ""}`}
              href={`/diario-professor?vinculo=${context.selected?.classSubjectId}${context.selectedSessionId ? `&sessao=${context.selectedSessionId}` : ""}&avaliacao=${assessment.id}`}
            >
              <b>{assessment.title}</b>
              <span>{dateLabel(assessment.assessmentDate)} • valor {assessment.maxScore.toLocaleString("pt-BR")}</span>
            </Link>)}
          </div>}
        </section>
      </div>

      <div className="twoCols dashboardLower">
        <section className="card panel">
          <SectionTitle title="Chamada" description={selectedSession ? `${dateLabel(selectedSession.sessionDate)} • ${selectedSession.content}` : "Registre uma aula para liberar a chamada."}/>
          {!selectedSession ? <div className="infoBox">Nenhuma aula selecionada.</div> : context.students.length === 0 ? <div className="infoBox">A turma ainda não possui alunos matriculados.</div> : <form action={saveAttendance}>
            <input type="hidden" name="classSubjectId" value={context.selected?.classSubjectId ?? ""}/>
            <input type="hidden" name="sessionId" value={selectedSession.id}/>
            <div className="tableScroll"><table className="dataTable"><thead><tr><th>Aluno</th><th>Matrícula</th><th>Presença</th></tr></thead><tbody>
              {context.students.map((student) => <tr key={student.userId}>
                <td>{student.fullName}<input type="hidden" name="studentId" value={student.userId}/></td>
                <td>{student.enrollmentNumber ?? "—"}</td>
                <td><select className="attendanceSelect" name={`attendance:${student.userId}`} defaultValue={context.attendance[student.userId] ?? "present"}>
                  {Object.entries(attendanceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select></td>
              </tr>)}
            </tbody></table></div>
            <button className="button primary formSubmit" type="submit">Salvar chamada</button>
          </form>}
        </section>

        <section className="card panel">
          <SectionTitle title="Lançamento de notas" description={selectedAssessment ? `${selectedAssessment.title} • valor máximo ${selectedAssessment.maxScore.toLocaleString("pt-BR")}` : "Crie uma avaliação para lançar notas."}/>
          {!selectedAssessment ? <div className="infoBox">Nenhuma avaliação selecionada.</div> : context.students.length === 0 ? <div className="infoBox">A turma ainda não possui alunos matriculados.</div> : <form action={saveGrades}>
            <input type="hidden" name="classSubjectId" value={context.selected?.classSubjectId ?? ""}/>
            <input type="hidden" name="assessmentId" value={selectedAssessment.id}/>
            <input type="hidden" name="maxScore" value={selectedAssessment.maxScore}/>
            <div className="tableScroll"><table className="dataTable"><thead><tr><th>Aluno</th><th>Matrícula</th><th>Nota</th></tr></thead><tbody>
              {context.students.map((student) => <tr key={student.userId}>
                <td>{student.fullName}<input type="hidden" name="studentId" value={student.userId}/></td>
                <td>{student.enrollmentNumber ?? "—"}</td>
                <td><input className="scoreInput" name={`grade:${student.userId}`} type="number" min="0" max={selectedAssessment.maxScore} step="0.01" defaultValue={context.grades[student.userId] ?? ""} placeholder="—"/></td>
              </tr>)}
            </tbody></table></div>
            <button className="button primary formSubmit" type="submit">Salvar notas</button>
          </form>}
        </section>
      </div>
    </>}
  </>;
}
