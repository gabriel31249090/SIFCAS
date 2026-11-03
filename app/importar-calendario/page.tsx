import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { PageHeader } from "@/components/UI";
import { CalendarForm } from "./CalendarForm";

export default async function ImportCalendarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAccount();
  const params = await searchParams;
  return <>
    <PageHeader title="Importar calendário do AVA" description="Cópia pessoal de um arquivo .ics. A exportação deve ser feita por você no ambiente autorizado." action={<Link href="/agenda-aluno" className="button soft">Abrir agenda</Link>}/>
    <section className="card panel"><p>Importe até 500 eventos e 750 KB, em UTF-8. Esta cópia não confirma entrega, correção ou ausência de pendências no AVA.</p>
      <p>URLs de assinatura com token não são solicitadas. Recorrências e fusos não suportados exigem revisão. Reimportar um UID atualiza apenas sua cópia pessoal; eventos ausentes no arquivo são preservados.</p>
      {params.error && <p role="alert">{params.error}</p>}
      {process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED === "true" ? <CalendarForm/> : <div className="infoBox" role="status">Importação aguardando configuração e homologação do armazenamento privado.</div>}
    </section>
  </>;
}
