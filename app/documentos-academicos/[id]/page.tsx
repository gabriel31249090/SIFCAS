import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { academicDocumentLabels, getAcademicDocumentById } from "@/lib/documents";
import PrintButton from "./PrintButton";
import styles from "./document.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Cuiaba" }).format(new Date(value));
}

function metric(value: number | null, suffix = "") {
  return value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${suffix}`;
}

export default async function AcademicDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccount();
  const { id } = await params;
  const document = await getAcademicDocumentById(id);
  if (!document) notFound();
  const snapshot = document.snapshot;

  return <>
    <div className={styles.screenActions}>
      <Link href="/documentos-academicos" className="button soft">Voltar aos documentos</Link>
      <PrintButton/>
    </div>

    <article className={styles.paper}>
      <header className={styles.header}>
        <div className={styles.mark}>S</div>
        <h1>{snapshot.institution.name}</h1>
        <p>{snapshot.institution.campusName} • {snapshot.institution.city}/{snapshot.institution.state}</p>
      </header>

      <div className={styles.status + " " + (document.revokedAt ? styles.revoked : styles.valid)}>
        {document.revokedAt ? "DOCUMENTO REVOGADO" : "DOCUMENTO VÁLIDO"}
      </div>

      <h2 className={styles.title}>{academicDocumentLabels[document.documentType]}</h2>

      {document.revokedAt && <div className={styles.notice}>
        Este documento foi revogado em {formatDate(document.revokedAt)}. {document.revocationReason || "Consulte a instituição para mais informações."}
      </div>}

      {document.documentType === "enrollment_declaration" && <p className={styles.bodyText}>
        Declaramos, para os devidos fins, que <strong>{snapshot.holder.fullName}</strong>, matrícula <strong>{snapshot.holder.enrollmentNumber || "não informada"}</strong>, está regularmente matriculado(a) no curso <strong>{snapshot.course.name}</strong>, turma <strong>{snapshot.class.name}</strong>, durante o período letivo <strong>{snapshot.period.name}</strong>, no {snapshot.institution.campusName}.
      </p>}

      {document.documentType === "completion_certificate" && <p className={styles.bodyText}>
        Certificamos que <strong>{snapshot.holder.fullName}</strong>, matrícula <strong>{snapshot.holder.enrollmentNumber || "não informada"}</strong>, concluiu o vínculo acadêmico registrado no curso <strong>{snapshot.course.name}</strong>, conforme os dados acadêmicos oficiais disponíveis no SIFCAS no momento desta emissão.
      </p>}

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}><small>Titular</small><strong>{snapshot.holder.fullName}</strong></div>
        <div className={styles.metaItem}><small>Matrícula</small><strong>{snapshot.holder.enrollmentNumber || "—"}</strong></div>
        <div className={styles.metaItem}><small>Curso</small><strong>{snapshot.course.name}</strong></div>
        <div className={styles.metaItem}><small>Turma</small><strong>{snapshot.class.name}</strong></div>
        <div className={styles.metaItem}><small>Período letivo</small><strong>{snapshot.period.name}</strong></div>
        <div className={styles.metaItem}><small>Emissão</small><strong>{formatDate(document.issuedAt)}</strong></div>
      </div>

      {document.documentType === "academic_record" && <>
        <p className={styles.bodyText}>Histórico acadêmico do vínculo registrado no SIFCAS, com notas e frequência disponíveis no momento da emissão.</p>
        <table className={styles.table}>
          <thead><tr><th>Disciplina</th><th>Média</th><th>Frequência</th><th>Faltas</th><th>Avaliações</th></tr></thead>
          <tbody>{snapshot.report.rows.map((row) => <tr key={row.classSubjectId}>
            <td>{row.subjectName}{row.subjectCode ? ` (${row.subjectCode})` : ""}</td>
            <td>{metric(row.average10)}</td>
            <td>{metric(row.frequency, "%")}</td>
            <td>{row.absences}</td>
            <td>{row.gradedAssessments}</td>
          </tr>)}</tbody>
        </table>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><small>Média geral</small><strong>{metric(snapshot.report.overallAverage10)}</strong></div>
          <div className={styles.metaItem}><small>Frequência geral</small><strong>{metric(snapshot.report.overallFrequency, "%")}</strong></div>
        </div>
      </>}

      <div className={styles.signature}>
        <div className={styles.signatureLine}>Documento emitido eletronicamente pelo SIFCAS</div>
      </div>

      <div className={styles.validation}>
        <strong>Validação de autenticidade</strong><br/>
        Código: <code>{document.verificationCode}</code><br/>
        Acesse <strong>sifcas.vercel.app/verificar-documento</strong> e informe o código acima.
      </div>
      <div className={styles.footer}>SIFCAS — Sistema Integrado Federal de Campus, Administração e Serviços</div>
    </article>
  </>;
}
