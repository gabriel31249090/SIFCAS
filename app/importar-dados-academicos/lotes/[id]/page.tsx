import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getAcademicImportBatch, getImportedAcademicContext } from "@/lib/academic-import-server";
import { confirmAcademicImport, cancelAcademicImport } from "../../actions";
import { getRequestTimestamp } from "@/lib/request-time";

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
    <section className="card panel"><p>Lote: {batch.id}</p><p>Origem: {diary?.instance ?? "Indisponível"} • período: {diary?.period ?? "Indisponível"}</p><p>SHA-256 do conteúdo normalizado: <code style={{ overflowWrap: "anywhere" }}>{batch.payload_hash}</code></p><p>{batch.total_rows} registros no lote.</p>
      {batch.status === "applied" ? <><p role="status" className="infoBox successBox">Cópia de leitura aplicada integralmente: {batch.inserted_rows} novos e {batch.unchanged_rows} já existentes. Nenhuma escrita foi enviada ao SUAP/AVA.</p>{diary && <Link className="button primary" href={`/diario-professor?vinculo=${diary.classSubjectId}`}>Abrir turma importada</Link>}</> : expired || ["cancelled", "expired"].includes(batch.status) ? <p role="status" className="infoBox">Lote {batch.status === "cancelled" ? "cancelado" : "expirado"}. Envie novamente o arquivo para gerar uma prévia válida. Nenhum registro foi aplicado por este lote.</p> : <>
        <p className="infoBox">Revise contagens, origem e registros. Uma confirmação aplica o diário completo; conflito bloqueia o lote e preserva os dados anteriores.</p>
        <p>{[...counts].map(([kind, count]) => `${kind}: ${count}`).join(" • ")}</p>
        {batch.conflicts.length > 0 && <div role="alert" className="infoBox errorBox"><b>{batch.conflicts.length} conflito(s)</b><ul>{batch.conflicts.map((c) => <li key={`${c.kind}:${c.external_id}`}>{c.kind} / {c.external_id}: {c.reason}</li>)}</ul><p>Revise os identificadores e valores na origem. Nenhum registro existente será sobrescrito.</p></div>}
        <form action={confirmAcademicImport} className="formStack"><input type="hidden" name="batchId" value={batch.id} /><label><input name="confirmed" type="checkbox" value="yes" required disabled={batch.conflicts.length > 0} /> Conferi o diário, período e dados autorizados para criar esta cópia de leitura.</label><button className="button primary" type="submit" disabled={batch.conflicts.length > 0}>Confirmar importação</button></form>
        <form action={cancelAcademicImport}><input type="hidden" name="batchId" value={batch.id} /><button className="button soft" type="submit">Cancelar e descartar prévia</button></form>
      </>}
    </section>
    {batch.payload && !expired && batch.status === "preview" && <><SectionTitle title="Registros reconhecidos" description="Primeiros 100 registros; as contagens consideram o arquivo completo. IDs preservam zeros iniciais. Vínculos são verificados no servidor." /><section className="card panel"><div className="tableScroll"><table className="dataTable"><thead><tr><th>Tipo</th><th>ID externo</th><th>Dados normalizados</th></tr></thead><tbody>{batch.payload.slice(0, 100).map((row) => <tr key={`${row.kind}:${row.external_id}`}><td>{row.kind}</td><td>{row.external_id}</td><td><code style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(row.payload)}</code></td></tr>)}</tbody></table></div></section></>}
  </>;
}
