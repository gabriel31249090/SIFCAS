import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getAcademicImportBatch, getImportedAcademicContext } from "@/lib/academic-import-server";
import { confirmAcademicImport, cancelAcademicImport } from "../../actions";
import { getRequestTimestamp } from "@/lib/request-time";
import { AeroIcon } from "@/components/AeroIcon";
import { BookOpenCheck, CalendarDays, CheckCircle2, CircleAlert, Clock3, FileText, Hash, ShieldCheck } from "lucide-react";

const kindLabels: Record<string, string> = { diary: "Diário", enrollment: "Matrícula", session: "Aula", attendance: "Frequência", assessment: "Avaliação", grade: "Nota", schedule: "Horário", event: "Atividade" };
const kindPluralLabels: Record<string, string> = { diary: "Diários", enrollment: "Matrículas", session: "Aulas", attendance: "Frequências", assessment: "Avaliações", grade: "Notas", schedule: "Horários", event: "Atividades" };
const fieldLabels: Record<string, string> = { title: "Título", date: "Data", starts_at: "Início", ends_at: "Término", content: "Descrição", session_id: "Aula relacionada", assessment_id: "Avaliação relacionada", status: "Situação", score: "Nota", max_score: "Nota máxima", weight: "Peso", weekday: "Dia da semana", room: "Local", url: "Endereço oficial" };
const statusLabels: Record<string, string> = { active: "Ativa", inactive: "Inativa", present: "Presença registrada", absent: "Falta registrada", late: "Atraso registrado", justified: "Falta justificada", graded: "Nota lançada", missing: "Sem nota registrada", exempt: "Dispensada", unreported: "Não informada" };
const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function displayValue(key: string, value: string | number | null) {
  if (value === null) return key === "score" ? "Sem nota" : "Não informado";
  if (key === "date" && typeof value === "string") return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  if (key === "weekday" && typeof value === "number") return weekdays[value] ?? String(value);
  if (key === "status" && typeof value === "string") return statusLabels[value] ?? value;
  return String(value);
}

export default async function AcademicImportBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const { id } = await params;
  const batch = await getAcademicImportBatch(account, id);
  if (!batch) notFound();
  const context = await getImportedAcademicContext(account);
  const diary = context.diaries.find((d) => d.id === batch.diary_id);
  const expired = batch.status === "preview" && new Date(batch.expires_at).getTime() <= getRequestTimestamp();
  const counts = new Map<string, number>();
  for (const row of batch.payload ?? []) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
  return <>
    <PageHeader title={batch.status === "applied" ? "Recibo de importação" : "Prévia do diário"} description={`${batch.filename} • ${diary?.label ?? "Diário vinculado"}`} action={<Link className="button soft" href="/importar-dados-academicos">Voltar ao histórico</Link>} />
    <section className="card panel"><div className="importBatchSummary"><div className="importBatchIcon"><AeroIcon icon={batch.status === "applied" ? CheckCircle2 : batch.status === "preview" ? BookOpenCheck : FileText} tone={batch.status === "applied" ? "leaf" : "sky"} size={24}/></div><div className="importBatchTitle"><span>{batch.status === "applied" ? "Importação concluída" : batch.status === "preview" ? "Confira antes de importar" : "Histórico do arquivo"}</span><h2>{batch.filename}</h2><p><BookOpenCheck size={14}/> {diary?.label ?? "Diário vinculado"}<span>·</span><CalendarDays size={14}/> {diary?.period ?? "Período indisponível"}</p></div></div>
      <div className="importBatchFacts"><span><FileText size={15}/> {batch.total_rows} registros</span><span><Clock3 size={15}/> {batch.status === "preview" ? `Prévia expira às ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" }).format(new Date(batch.expires_at))}` : batch.status === "applied" ? "Cópia de leitura" : "Lote encerrado"}</span><span><ShieldCheck size={15}/> Acesso restrito ao responsável pelo diário</span></div>
      <details className="importTechnicalDetails"><summary><Hash size={14}/> Ver identificador e conferência do arquivo</summary><p><span>Identificador do lote</span><code>{batch.id}</code></p><p><span>Verificação do conteúdo</span><code>{batch.payload_hash}</code></p></details>
      {batch.status === "applied" ? <><p role="status" className="infoBox successBox">Cópia de leitura aplicada integralmente: {batch.inserted_rows} novos e {batch.unchanged_rows} já existentes. Nenhuma escrita foi enviada ao SUAP/AVA.</p>{diary && <Link className="button primary" href={`/diario-professor?vinculo=${diary.classSubjectId}`}><BookOpenCheck size={16}/> Abrir turma importada</Link>}</> : expired || ["cancelled", "expired"].includes(batch.status) ? <p role="status" className="infoBox">Lote {batch.status === "cancelled" ? "cancelado" : "expirado"}. Envie novamente o arquivo para gerar uma prévia válida. Nenhum registro foi aplicado por este lote.</p> : <>
        <p className="infoBox"><CircleAlert size={15} aria-hidden="true"/> Uma confirmação aplica todos os registros. Se houver conflito, o lote fica bloqueado e os dados anteriores são preservados.</p>
        <div className="importRecordCounts" aria-label="Contagem por tipo de registro">{[...counts].map(([kind, count]) => <span key={kind}>{count} {count === 1 ? (kindLabels[kind] ?? kind) : (kindPluralLabels[kind] ?? `${kindLabels[kind] ?? kind}s`)}</span>)}</div>
        {batch.conflicts.length > 0 && <div role="alert" className="infoBox errorBox"><b>{batch.conflicts.length} conflito(s)</b><ul>{batch.conflicts.map((c) => <li key={`${c.kind}:${c.external_id}`}>{c.kind} / {c.external_id}: {c.reason}</li>)}</ul><p>Revise os identificadores e valores na origem. Nenhum registro existente será sobrescrito.</p></div>}
        <form action={confirmAcademicImport} className="formStack"><input type="hidden" name="batchId" value={batch.id} /><label><input name="confirmed" type="checkbox" value="yes" required disabled={batch.conflicts.length > 0} /> Conferi o diário, período e dados autorizados para criar esta cópia de leitura.</label><button className="button primary" type="submit" disabled={batch.conflicts.length > 0}>Confirmar importação</button></form>
        <form action={cancelAcademicImport}><input type="hidden" name="batchId" value={batch.id} /><button className="button soft" type="submit">Cancelar e descartar prévia</button></form>
      </>}
    </section>
    {batch.payload && !expired && batch.status === "preview" && <><SectionTitle title="Registros reconhecidos" description="Confira os primeiros 100 registros. Os totais no arquivo consideram o conjunto completo; os vínculos são validados antes de aplicar."/><section className="card panel"><div className="tableScroll"><table className="dataTable"><thead><tr><th>Registro</th><th>Identificadores</th><th>Informações para conferência</th></tr></thead><tbody>{batch.payload.slice(0, 100).map((row) => <tr key={`${row.kind}:${row.external_id}`}><td>{kindLabels[row.kind] ?? row.kind}</td><td><span className="importExternalId">{row.external_id}</span>{row.student_external_id && <small className="importStudentId">Matrícula {row.student_external_id}</small>}</td><td><dl className="importRecordFields">{Object.entries(row.payload).map(([key, value]) => <div className={key === "content" ? "importRecordLongField" : undefined} key={key}><dt>{fieldLabels[key] ?? key}</dt><dd>{displayValue(key, value)}</dd></div>)}</dl></td></tr>)}</tbody></table></div></section></>}
  </>;
}
