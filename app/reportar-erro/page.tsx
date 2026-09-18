import { Bug, CheckCircle2, Clock3, Send, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listBugReports } from "@/lib/experience";
import { createBugReport, manageBugReport } from "./actions";

type Params = Promise<{ message?: string; error?: string; route?: string }>;

const statusLabels: Record<string,string> = { open:"Aberto", reviewing:"Em análise", resolved:"Resolvido", closed:"Fechado" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(value));
}

export default async function ReportErrorPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  const params = await searchParams;
  const reports = await listBugReports(account);
  const canManage = ["staff","manager","admin"].includes(account.role);
  const open = reports.filter((item) => ["open","reviewing"].includes(item.status)).length;
  const resolved = reports.filter((item) => ["resolved","closed"].includes(item.status)).length;

  return <>
    <PageHeader title="Reportar erro" description="Informe um problema do SIFCAS e acompanhe a análise da equipe responsável." action={<span className="badge"><Bug size={13}/> Qualidade do sistema</span>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Relatos visíveis" value={String(reports.length)} foot={canManage ? "Fila de qualidade" : "Enviados por você"} icon={Bug}/>
      <StatCard label="Em análise" value={String(open)} foot="Abertos ou em revisão" icon={Clock3}/>
      <StatCard label="Finalizados" value={String(resolved)} foot="Resolvidos ou fechados" icon={CheckCircle2}/>
      <StatCard label="Canal" value="SIFCAS" foot="Rastreável por usuário" icon={ShieldCheck}/>
    </div>

    <SectionTitle title="Novo relato" description="Diga em qual página aconteceu, o que você tentou fazer e o que ocorreu."/>
    <form action={createBugReport} className="card panel formStack">
      <label>Página/rota<input name="route" defaultValue={params.route ?? "/"} maxLength={300} required placeholder="/boletim"/></label>
      <label>Título<input name="title" minLength={3} maxLength={180} required placeholder="Ex.: botão de salvar não respondeu"/></label>
      <label>Descrição<textarea name="description" maxLength={10000} rows={5} placeholder="Explique os passos, o resultado esperado e o que apareceu na tela."/></label>
      <button className="button primary" type="submit"><Send size={15}/> Enviar relato</button>
    </form>

    <SectionTitle title={canManage ? "Fila de erros reportados" : "Meus relatos"} description="O histórico permanece visível para acompanhamento."/>
    <div className="reportGrid">
      {reports.length === 0 && <div className="infoBox">Nenhum erro reportado ainda.</div>}
      {reports.map((item) => <article className="card reportCard" key={item.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[item.status] ?? item.status}</span><h3>{item.title}</h3><small>{item.route} • {formatDate(item.created_at)}</small></div></div>
        {item.description && <p className="requestBody">{item.description}</p>}
        {item.response && <div className="infoBox"><b>Resposta</b><br/>{item.response}</div>}
        {canManage && <form action={manageBugReport} className="formStack requestManager">
          <input type="hidden" name="id" value={item.id}/>
          <label>Status<select name="status" defaultValue={item.status}><option value="open">Aberto</option><option value="reviewing">Em análise</option><option value="resolved">Resolvido</option><option value="closed">Fechado</option></select></label>
          <label>Resposta<textarea name="response" rows={3} maxLength={10000} defaultValue={item.response ?? ""}/></label>
          <button className="button soft" type="submit">Salvar atendimento</button>
        </form>}
      </article>)}
    </div>
  </>;
}
