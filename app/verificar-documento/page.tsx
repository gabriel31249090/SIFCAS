import type { Metadata } from "next";
import { BadgeCheck, CircleAlert, SearchCheck } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { academicDocumentLabels, verifyAcademicDocument } from "@/lib/documents";

export const metadata: Metadata = {
  title: "Verificar documento",
  description: "Consulte a autenticidade de documentos acadêmicos emitidos pelo SIFCAS.",
  alternates: { canonical: "/verificar-documento" },
};

type SearchParams = Promise<{ codigo?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Cuiaba",
  }).format(new Date(value));
}

export default async function VerifyDocumentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const code = (params.codigo ?? "").trim().toUpperCase();
  const document = code ? await verifyAcademicDocument(code) : null;

  return <>
    <PageHeader
      title="Verificar documento"
      description="Consulte a autenticidade de declarações, históricos e certificados emitidos pelo SIFCAS."
      action={<span className="badge">Consulta pública</span>}
    />

    <section className="card panel" style={{ maxWidth: 760, margin: "0 auto" }}>
      <SectionTitle title="Código de autenticidade" description="Digite o código no formato SIF-XXXXXXXXXXXXXXXX."/>
      <form method="get" className="formStack">
        <label>Código
          <input name="codigo" defaultValue={code} placeholder="SIF-XXXXXXXXXXXXXXXX" maxLength={20} required/>
        </label>
        <button className="button primary" type="submit"><SearchCheck size={16}/> Verificar</button>
      </form>
    </section>

    {code && !document && <section className="card panel" style={{ maxWidth: 760, margin: "18px auto 0" }}>
      <div className="infoBox errorBox"><CircleAlert size={16}/> Código não encontrado ou inválido.</div>
    </section>}

    {document && <section className="card panel" style={{ maxWidth: 760, margin: "18px auto 0" }}>
      <div className="panelHeading">
        <BadgeCheck size={24}/>
        <div><h2>{document.revokedAt ? "Documento revogado" : "Documento autêntico"}</h2><p>Registro localizado na base oficial do SIFCAS.</p></div>
      </div>
      <div className="readonlyGrid">
        <div className="infoBox"><b>Tipo</b><br/>{academicDocumentLabels[document.documentType]}</div>
        <div className="infoBox"><b>Titular</b><br/>{document.snapshot.holder.fullName}</div>
        <div className="infoBox"><b>Emissão</b><br/>{formatDate(document.issuedAt)}</div>
      </div>
      <div className="infoBox" style={{ marginTop: 12 }}>
        <b>Curso:</b> {document.snapshot.course.name}<br/>
        <b>Campus:</b> {document.snapshot.institution.campusName}<br/>
        <b>Código:</b> {document.verificationCode}<br/>
        <b>Status:</b> {document.revokedAt ? `Revogado em ${formatDate(document.revokedAt)}${document.revocationReason ? ` — ${document.revocationReason}` : ""}` : "Válido"}
      </div>
    </section>}
  </>;
}
