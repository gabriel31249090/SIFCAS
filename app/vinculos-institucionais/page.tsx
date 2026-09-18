import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, ShieldCheck, Upload, UserCheck, UserRoundSearch, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount, roleLabels, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applyInstitutionalBatch, importInstitutionalCsv } from "./actions";
import { redirect } from "next/navigation";

type Params = Promise<{ message?: string; error?: string }>;

const statusLabels: Record<string,string> = {
  validated: "Validado",
  applied: "Aplicado",
  failed: "Falhou",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  awaiting_account: "Aguardando conta",
  conflict: "Conflito",
  inactive: "Inativo",
};

function fmt(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(value));
}

export default async function InstitutionalLinksPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (account.role !== "admin") redirect("/acesso-negado");
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: batches, error: batchError }, { data: records, error: recordError }] = await Promise.all([
    supabase
      .from("institutional_import_batches")
      .select("id,source_name,filename,status,total_rows,valid_rows,invalid_rows,applied_rows,awaiting_rows,conflict_rows,created_at,applied_at")
      .order("created_at",{ascending:false})
      .limit(20),
    supabase
      .from("institutional_identity_records")
      .select("id,batch_id,external_id,full_name,institutional_email,proposed_role,campus,course_code,class_code,situation,approval_status,match_status,validation_error,created_at,applied_at")
      .order("updated_at",{ascending:false})
      .limit(200),
  ]);
  if (batchError || recordError) throw batchError ?? recordError;

  const all = records ?? [];
  const applied = all.filter((row) => row.match_status === "applied").length;
  const awaiting = all.filter((row) => row.match_status === "awaiting_account").length;
  const conflicts = all.filter((row) => row.match_status === "conflict").length;
  const invalid = all.filter((row) => Boolean(row.validation_error)).length;

  return <>
    <PageHeader
      title="Vínculos Institucionais"
      description="Importe uma base oficial, revise os vínculos e deixe o SIFCAS identificar estudantes, professores, servidores e gestores sem permitir criação de administradores."
      action={<span className="badge"><ShieldCheck size={13}/> Somente ADM</span>}
    />
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Registros" value={String(all.length)} foot="Últimos vínculos importados" icon={UsersRound}/>
      <StatCard label="Aplicados" value={String(applied)} foot="Contas validadas" icon={UserCheck}/>
      <StatCard label="Aguardando conta" value={String(awaiting)} foot="Serão vinculados quando houver cadastro confirmado" icon={UserRoundSearch}/>
      <StatCard label="Conflitos/erros" value={String(conflicts + invalid)} foot="Precisam de revisão" icon={FileSpreadsheet}/>
    </div>

    <SectionTitle title="1. Importar base oficial" description="O arquivo é validado primeiro. Nenhum papel é alterado até você aplicar o lote."/>
    <section className="card panel">
      <form action={importInstitutionalCsv} className="formStack">
        <label>Nome da fonte
          <input name="sourceName" defaultValue="IFMT — Base Institucional" maxLength={120} required/>
        </label>
        <label>Arquivo CSV
          <input type="file" name="file" accept=".csv,text/csv" required/>
        </label>
        <div className="infoBox">
          Colunas aceitas: <b>nome, email, identificador/matricula/siape, tipo_vinculo, campus, curso, turma, situacao</b>. 
          Papéis reconhecidos: aluno/estudante, professor/docente, servidor/TAE e gestor. <b>Admin é sempre rejeitado pela importação.</b>
        </div>
        <div className="heroActions">
          <button className="button primary" type="submit"><Upload size={15}/> Importar e validar</button>
          <a className="button soft" href="/modelo-vinculos-institucionais" download>Baixar modelo CSV</a>
        </div>
      </form>
    </section>

    <SectionTitle title="2. Revisar e aplicar lotes" description="Aplicar um lote aprova registros válidos e tenta casar contas existentes por e-mail confirmado."/>
    <div className="batchGrid">
      {(batches ?? []).length === 0 && <div className="infoBox">Nenhum lote importado ainda.</div>}
      {(batches ?? []).map((batch) => <article className="card batchCard" key={batch.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[batch.status] ?? batch.status}</span><h3>{batch.source_name}</h3><small>{batch.filename} • {fmt(batch.created_at)}</small></div></div>
        <div className="requestMeta">
          <span className="badge">{batch.total_rows} linhas</span>
          <span className="badge">{batch.valid_rows} válidas</span>
          <span className="badge">{batch.invalid_rows} inválidas</span>
          {batch.status === "applied" && <><span className="badge">{batch.applied_rows} aplicadas</span><span className="badge">{batch.awaiting_rows} aguardando</span><span className="badge">{batch.conflict_rows} conflitos</span></>}
        </div>
        {batch.status !== "applied" && <form action={applyInstitutionalBatch}><input type="hidden" name="batchId" value={batch.id}/><button className="button primary" type="submit"><CheckCircle2 size={15}/> Aprovar e aplicar lote</button></form>}
      </article>)}
    </div>

    <SectionTitle title="3. Registros institucionais" description="A origem continua separada das contas do SIFCAS para permitir sincronização e auditoria futuras."/>
    <div className="tableScroll"><table className="dataTable"><thead><tr><th>Pessoa</th><th>Identificador</th><th>Vínculo</th><th>Campus/Acadêmico</th><th>Validação</th><th>Correspondência</th></tr></thead><tbody>
      {all.map((row) => <tr key={row.id}>
        <td><b>{row.full_name}</b><br/><small>{row.institutional_email}</small></td>
        <td>{row.external_id}</td>
        <td>{roleLabels[row.proposed_role as AppRole] ?? row.proposed_role}<br/><small>{row.situation === "active" ? "Ativo" : "Inativo"}</small></td>
        <td>{row.campus}<br/><small>{[row.course_code,row.class_code].filter(Boolean).join(" • ") || "Sem curso/turma na fonte"}</small></td>
        <td>{row.validation_error ? <span className="badge">Erro</span> : <span className="badge">{statusLabels[row.approval_status] ?? row.approval_status}</span>}<br/><small>{row.validation_error || "Registro estruturalmente válido"}</small></td>
        <td><span className="badge">{statusLabels[row.match_status] ?? row.match_status}</span>{row.applied_at && <><br/><small>{fmt(row.applied_at)}</small></>}</td>
      </tr>)}
    </tbody></table></div>

    <div className="infoBox" style={{ marginTop: 18 }}>
      Novas contas sem correspondência oficial ficam com acesso interno pendente. Quando o e-mail confirmado corresponder a um registro aprovado, o SIFCAS aplica o papel automaticamente. Alterações manuais continuam disponíveis em <Link href="/usuarios"><b>Usuários e Permissões</b></Link>.
    </div>
  </>;
}
