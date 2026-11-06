import Link from "next/link";
import type { CurrentAccount } from "@/lib/auth";
import { getImportedAcademicContext } from "@/lib/academic-import-server";

const kindLabels: Record<string, string> = {
  diary: "Diário", enrollment: "Matrícula", session: "Aula", attendance: "Frequência",
  assessment: "Avaliação", grade: "Nota", schedule: "Horário", event: "Evento AVA",
};
const fieldLabels: Record<string, string> = {
  title: "Título", name: "Nome", content: "Conteúdo", description: "Descrição",
  date: "Data", session_date: "Data", assessment_date: "Data", starts_at: "Início", ends_at: "Término",
  weekday: "Dia da semana", room: "Sala", score: "Nota", max_score: "Escala máxima", weight: "Peso",
  status: "Situação", grade_status: "Situação da nota", attendance_status: "Frequência",
  student_external_id: "Matrícula externa", student_id: "Matrícula externa", enrollment_number: "Matrícula",
  session_external_id: "Aula externa", session_id: "Aula externa", assessment_external_id: "Avaliação externa", assessment_id: "Avaliação externa",
  course_code: "Curso", class_code: "Turma", period: "Período", subject: "Disciplina", subject_name: "Disciplina",
  url: "Referência", starts: "Início", ends: "Término", timezone: "Fuso", summary: "Resumo",
};
const valueLabels: Record<string, string> = {
  active: "Ativa", inactive: "Inativa", present: "Presente", absent: "Falta", late: "Atraso",
  justified: "Justificada", graded: "Nota informada", missing: "Ausente", exempt: "Dispensado", unreported: "Não informado",
};

export async function ImportedAcademicSummary({ account, classSubjectId, kinds }: {
  account: CurrentAccount; classSubjectId?: string; kinds?: string[];
}) {
  const context = await getImportedAcademicContext(account, classSubjectId);
  return <section className="card panel" aria-label="Cópias acadêmicas importadas" style={{ marginTop: 18 }}>
    <div className="sectionTitle"><div><h2>Dados importados · somente leitura</h2>
      <p>A origem mantém os registros oficiais. Planejamento e lançamentos locais do SIFCAS continuam separados desta cópia.</p></div></div>
    {context.status === "unavailable" ? <div className="infoBox" role="status">Os dados importados estão indisponíveis. Tente novamente mais tarde ou contate a equipe responsável; esta falha não indica ausência de pendências.</div>
      : context.diaries.length === 0 ? <div className="infoBox">Nenhuma cópia acadêmica importada disponível para este vínculo. O diário do SUAP/AVA não é sincronizado automaticamente; consulte a origem oficial até que a importação seja configurada e homologada.</div>
        : context.diaries.map((diary) => {
          const records = diary.records.filter((record) => !kinds || kinds.includes(record.kind));
          return <article key={diary.id} style={{ marginTop: 16 }}>
            <h3>{diary.label}</h3>
            <p>Origem: {diary.instance === "sifcas-layout" ? "Arquivo no formato SIFCAS · origem declarada" : diary.instance} · Diário externo: {diary.externalId}</p>
            <p>Última importação: {diary.updatedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(diary.updatedAt)) + " (America/Cuiaba)" : "a confirmar"}.</p>
            <p>{Object.entries(diary.counts).filter(([kind]) => !kinds || kinds.includes(kind)).map(([kind, count]) => `${kindLabels[kind] ?? kind}: ${count}`).join(" · ")}</p>
            {records.length > 0 && <div className="tableScroll"><table className="dataTable"><thead><tr><th>Tipo</th><th>Identificador externo</th><th>Informações da cópia</th></tr></thead><tbody>
              {records.slice(0, 80).map((record) => <tr key={`${record.kind}:${record.externalId}`}>
                <td>{kindLabels[record.kind] ?? record.kind}</td><td>{record.externalId}{record.studentExternalId && <small> · Matrícula {record.studentExternalId}</small>}</td>
                <td>{Object.entries(record.payload).filter(([key, value]) => fieldLabels[key] && value !== null && value !== "").map(([key, value]) => <div key={key}><b>{fieldLabels[key]}:</b> {valueLabels[String(value)] ?? String(value)}</div>)}</td>
              </tr>)}
            </tbody></table></div>}
            {records.length > 80 && <p>Exibidos os primeiros 80 de {records.length} registros. Abra a importação para conferir o lote.</p>}
            <Link className="button soft" href={`/importar-dados-academicos?diario=${encodeURIComponent(diary.id)}`}>Consultar importação</Link>
          </article>;
        })}
    {["teacher", "manager", "admin"].includes(account.role) && <p><Link className="button soft" href="/importar-dados-academicos">Importar dados acadêmicos</Link></p>}
  </section>;
}
