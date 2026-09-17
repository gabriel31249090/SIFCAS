import Link from "next/link";
import { BadgeCheck, FileCheck2, FileClock, GraduationCap, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import {
  academicDocumentLabels,
  getDocumentEligibility,
  listAcademicDocuments,
} from "@/lib/documents";
import { issueAcademicDocument, revokeAcademicDocument } from "./actions";

type SearchParams = Promise<{ message?: string; error?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Cuiaba",
  }).format(new Date(value));
}

export default async function AcademicDocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  const params = await searchParams;
  const documents = await listAcademicDocuments();
  const eligibility = account.role === "student" ? await getDocumentEligibility(account.id) : null;
  const validCount = documents.filter((doc) => !doc.revokedAt).length;
  const revokedCount = documents.length - validCount;

  return <>
    <PageHeader
      title="Documentos Acadêmicos"
      description="Emita documentos com dados reais do SIFCAS, acompanhe o histórico de emissões e valide cada documento por código público de autenticidade."
      action={<Link href="/verificar-documento" className="button soft">Verificar documento</Link>}
    />

    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Emitidos" value={String(documents.length)} foot="Documentos visíveis ao seu perfil" icon={FileClock}/>
      <StatCard label="Válidos" value={String(validCount)} foot="Autenticidade ativa" icon={FileCheck2}/>
      <StatCard label="Revogados" value={String(revokedCount)} foot="Mantidos para auditoria" icon={ShieldCheck}/>
      <StatCard label="Validação" value="Pública" foot="Por código SIF" icon={BadgeCheck}/>
    </div>

    {account.role === "student" && eligibility && <>
      <SectionTitle title="Emitir documento" description="A emissão usa o estado atual da sua matrícula e congela os dados em um registro verificável."/>
      <div className="moduleGrid">
        <section className="card moduleCard">
          <div className="moduleTop"><GraduationCap size={21}/><span className="badge">autoatendimento</span></div>
          <h3>Declaração de matrícula</h3>
          <p>Comprova vínculo ativo, curso, turma, período letivo e campus.</p>
          <form action={issueAcademicDocument} style={{ marginTop: 16 }}>
            <input type="hidden" name="documentType" value="enrollment_declaration"/>
            <button className="button soft" type="submit" disabled={!eligibility.enrollmentDeclarationId}>
              {eligibility.enrollmentDeclarationId ? "Emitir declaração" : "Sem matrícula ativa"}
            </button>
          </form>
        </section>

        <section className="card moduleCard">
          <div className="moduleTop"><FileCheck2 size={21}/><span className="badge">notas + frequência</span></div>
          <h3>Histórico escolar</h3>
          <p>Registra disciplinas, médias, frequência e faltas disponíveis no vínculo acadêmico atual.</p>
          <form action={issueAcademicDocument} style={{ marginTop: 16 }}>
            <input type="hidden" name="documentType" value="academic_record"/>
            <button className="button soft" type="submit" disabled={!eligibility.academicRecordId}>
              {eligibility.academicRecordId ? "Emitir histórico" : "Sem vínculo acadêmico"}
            </button>
          </form>
        </section>

        <section className="card moduleCard">
          <div className="moduleTop"><BadgeCheck size={21}/><span className="badge">conclusão</span></div>
          <h3>Certificado de conclusão</h3>
          <p>Só pode ser emitido quando a matrícula estiver oficialmente marcada como concluída.</p>
          <form action={issueAcademicDocument} style={{ marginTop: 16 }}>
            <input type="hidden" name="documentType" value="completion_certificate"/>
            <button className="button soft" type="submit" disabled={!eligibility.completionCertificateId}>
              {eligibility.completionCertificateId ? "Emitir certificado" : "Conclusão ainda não registrada"}
            </button>
          </form>
        </section>
      </div>
    </>}

    {["manager", "admin"].includes(account.role) && <div className="infoBox" style={{ marginTop: 22 }}>
      Como {account.role === "admin" ? "Administrador Geral" : "Gestor"}, você visualiza as emissões acadêmicas para auditoria e pode revogar documentos quando necessário.
    </div>}

    <SectionTitle title="Documentos emitidos" description="Cada emissão permanece registrada mesmo depois de revogada, preservando a trilha de auditoria."/>
    <section className="card panel">
      {documents.length === 0 ? <div className="infoBox">Nenhum documento acadêmico foi emitido ainda.</div> : <div className="tableScroll"><table className="dataTable">
        <thead><tr><th>Documento</th><th>Titular</th><th>Emissão</th><th>Código</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>{documents.map((doc) => <tr key={doc.id}>
          <td><b>{academicDocumentLabels[doc.documentType]}</b></td>
          <td>{doc.holderName}</td>
          <td>{formatDate(doc.issuedAt)}</td>
          <td><code>{doc.verificationCode}</code></td>
          <td>{doc.revokedAt ? <span className="badge">Revogado</span> : <span className="badge">Válido</span>}</td>
          <td>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="button soft" href={`/documentos-academicos/${doc.id}`}>Abrir</Link>
              {["manager", "admin"].includes(account.role) && !doc.revokedAt && <form action={revokeAcademicDocument}>
                <input type="hidden" name="id" value={doc.id}/>
                <input type="hidden" name="reason" value="Revogado pela gestão acadêmica"/>
                <button className="button soft" type="submit">Revogar</button>
              </form>}
            </div>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </section>

    {!["student", "manager", "admin"].includes(account.role) && <div className="infoBox" style={{ marginTop: 18 }}>
      A emissão acadêmica é destinada a estudantes. Seu perfil atual pode usar a área pública de verificação de autenticidade.
    </div>}
  </>;
}
