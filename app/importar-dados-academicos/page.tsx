import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getAcademicImportBatches, getImportedAcademicContext, type AcademicImportBatch } from "@/lib/academic-import-server";
import { previewAcademicImport } from "./actions";
import { getRequestTimestamp } from "@/lib/request-time";
import { CalendarDays, CheckCheck, Download, FileSpreadsheet, FileUp, SlidersHorizontal } from "lucide-react";

const statuses: Record<string, string> = { preview: "Aguardando confirmação", applied: "Aplicado — cópia de leitura", cancelled: "Cancelado", expired: "Expirado" };

export default async function AcademicImportPage({ searchParams }: { searchParams: Promise<{ diario?: string; error?: string; message?: string }> }) {
  const account = await requireAccount();
  const params = await searchParams;
  const now = getRequestTimestamp();
  const context = await getImportedAcademicContext(account);
  const canImport = ["teacher", "manager", "admin"].includes(account.role);
  let batches: AcademicImportBatch[] = [];
  let historyUnavailable = false;
  if (canImport && context.status !== "unavailable") {
    try { batches = await getAcademicImportBatches(account); } catch { historyUnavailable = true; }
  }
  return <>
    <PageHeader title="Importar dados acadêmicos" description="Aproveite um diário existente com uma confirmação. Dados importados são cópias de leitura; os registros oficiais continuam no SUAP e no AVA." action={<Link className="button soft" href="/diario-professor">Minhas turmas</Link>} />
    <div className="infoBox">Projeto SIFCAS em homologação. O layout abaixo é próprio do SIFCAS e não foi validado como exportação nativa do SUAP. Conectores SUAP/AVA: integração aguardando configuração.</div>
    {params.error && <p role="alert" className="infoBox errorBox">{params.error}</p>}
    {params.message && <p role="status" className="infoBox successBox">{params.message}</p>}
    {context.status === "unavailable" ? <section className="card panel"><h2>Integração aguardando configuração</h2><p>O banco de homologação e os mapas de diários/matrículas ainda precisam ser validados. Nenhum arquivo será enviado ou marcado como sincronizado.</p><p>TI: conferir o contrato isolado, RLS, vínculos e retenção antes de habilitar a importação.</p></section> : <>
      <SectionTitle title="1. Origem, formato e diário" description="Escolha um diário previamente vinculado à sua conta e período. Não é necessário cadastrar a turma novamente." />
      {!canImport ? <p className="infoBox">Seu perfil possui leitura dos próprios dados. A importação institucional é restrita aos docentes vinculados e operadores autorizados. Use sua agenda pessoal para calendários do AVA.</p> : context.diaries.length === 0 ? <p className="infoBox">Sem diários autorizados. Solicite o mapeamento do identificador externo para sua turma existente. Nomes e e-mails não são usados para criar vínculos.</p> : <section className="card panel"><form action={previewAcademicImport} className="formStack">
        <label><span className="formFieldLabel"><FileSpreadsheet size={16} aria-hidden="true"/>Formato</span><select name="format" defaultValue="sifcas-academic-v1"><option value="sifcas-academic-v1">CSV SIFCAS v1 — conversão revisada</option></select></label>
        <label><span className="formFieldLabel"><CalendarDays size={16} aria-hidden="true"/>Diário e período</span><select name="diaryId" defaultValue={params.diario ?? context.diaries[0]?.id} required>{context.diaries.map((d) => <option value={d.id} key={d.id}>{d.label} • {d.period} • ID {d.externalId} • {d.instance}</option>)}</select></label>
        <label><span className="formFieldLabel"><FileUp size={16} aria-hidden="true"/>Arquivo CSV UTF-8 (máximo 750 KB / 10.000 registros)</span><input name="file" type="file" accept=".csv,text/csv" required /></label>
        <details><summary>Mapear cabeçalhos de outro arquivo</summary><p>Converta cabeçalhos sem digitar cada registro. Os valores também precisam cumprir o contrato SIFCAS. Exemplo: {`{"external_id":"registro","diary_id":"diario","student_id":"matricula"}`}.</p><label><span className="formFieldLabel"><SlidersHorizontal size={16} aria-hidden="true"/>Mapeamento JSON</span><textarea name="mapping" maxLength={5000} placeholder='{"external_id":"registro"}' /></label></details>
        <div className="heroActions"><button className="button primary" type="submit"><CheckCheck size={17} aria-hidden="true"/>Validar e visualizar prévia</button><a className="button soft" href="/modelo-importacao-academica.csv" download><Download size={16} aria-hidden="true"/>Baixar exemplo sintético</a></div>
        <p>A prévia fica privada por até 30 minutos. Conflitos bloqueiam a aplicação completa; registros existentes são preservados. Dados ausentes no arquivo nunca apagam registros.</p>
      </form></section>}
      <SectionTitle title="2. Histórico e retomada" description="Uma prévia pode ser retomada pelo dono durante 30 minutos. Reimportar o mesmo conteúdo retorna o recibo existente." />
      {historyUnavailable ? <p role="alert" className="infoBox">Histórico indisponível. Tente novamente; não é possível afirmar que não há lotes.</p> : <section className="card panel">{batches.length === 0 ? <p>Nenhum lote disponível para sua conta.</p> : <div className="tableScroll"><table className="dataTable"><thead><tr><th>Arquivo</th><th>Estado</th><th>Registros</th><th>Revisão</th></tr></thead><tbody>{batches.map((b) => <tr key={b.id}><td>{b.filename}</td><td>{b.status === "preview" && new Date(b.expires_at).getTime() <= now ? "Expirado" : statuses[b.status] ?? b.status}</td><td>{b.total_rows}</td><td><Link href={`/importar-dados-academicos/lotes/${b.id}`}>{b.status === "applied" ? "Ver recibo" : "Retomar prévia"}</Link></td></tr>)}</tbody></table></div>}</section>}
      <SectionTitle title="Turmas e dados disponíveis" description="A origem e o horário acompanham a cópia. Não equivale a uma sincronização contínua." />
      {context.diaries.map((d) => <section className="card panel" key={d.id}><h3>{d.label} • {d.period}</h3><p>Origem: {d.instance} • ID externo: {d.externalId}</p><p>{d.updatedAt ? `Última importação: ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(d.updatedAt))}` : "Ainda sem dados importados."}</p><p>{Object.entries(d.counts).map(([kind, count]) => `${kind}: ${count}`).join(" • ")}</p><Link href={`/diario-professor?vinculo=${d.classSubjectId}`}>Abrir turma</Link></section>)}
    </>}
    <section className="card panel"><h2>O que pode ser aproveitado</h2><p>Turma/diário, matrículas já verificadas, aulas, frequência, avaliações, notas com escala explícita, horários e eventos. Zero, ausente, dispensado e não informado permanecem distintos. Arquivos não concedem papéis nem criam contas.</p><p>PDFs e sistemas sensíveis permanecem como referência ou link oficial. Ações e correções oficiais continuam na origem.</p><a href="/modelo-importacao-academica.csv" download>Modelo sintético do contrato SIFCAS v1</a></section>
  </>;
}
