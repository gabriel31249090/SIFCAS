import { redirect } from "next/navigation";
import { CircleCheckBig, Clock3, Headphones, MessageSquareText, Send, TicketCheck } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount, roleLabels } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cancelServiceRequest, createServiceRequest, manageServiceRequest } from "./actions";

const categoryLabels: Record<string, string> = {
  academic: "Acadêmico", documents: "Documentos", people: "Pessoas", infrastructure: "Infraestrutura", it: "Tecnologia", transport: "Transporte", other: "Outros",
};
const statusLabels: Record<string, string> = {
  open: "Aberta", in_progress: "Em atendimento", waiting: "Aguardando", resolved: "Resolvida", cancelled: "Cancelada",
};
const priorityLabels: Record<string, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };

type Params = Promise<{ message?: string; error?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function ServiceRequestsPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  const params = await searchParams;
  const supabase = await createClient();
  const canManage = ["staff", "manager", "admin"].includes(account.role);

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select("id,requester_user_id,category,title,description,priority,status,assigned_to,response,created_at,updated_at,resolved_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const peopleIds = [...new Set((requests ?? []).flatMap((row) => [row.requester_user_id, row.assigned_to].filter(Boolean) as string[]))];
  let people = new Map<string, { full_name: string | null; institutional_email: string | null }>();
  if (peopleIds.length) {
    const { data } = await supabase.from("profiles").select("id,full_name,institutional_email").in("id", peopleIds);
    people = new Map((data ?? []).map((row) => [row.id, row]));
  }

  let staffOptions: Array<{ id: string; label: string }> = [];
  if (canManage) {
    const [{ data: roleRows }, { data: profileRows }] = await Promise.all([
      supabase.from("user_roles").select("user_id,role").in("role", ["staff", "manager", "admin"]),
      supabase.from("profiles").select("id,full_name,institutional_email").eq("account_status", "active").order("full_name"),
    ]);
    const allowedIds = new Set((roleRows ?? []).map((row) => row.user_id));
    staffOptions = (profileRows ?? []).filter((row) => allowedIds.has(row.id)).map((row) => ({ id: row.id, label: row.full_name || row.institutional_email || "Servidor" }));
  }

  const rows = requests ?? [];
  const open = rows.filter((row) => row.status === "open").length;
  const active = rows.filter((row) => ["in_progress", "waiting"].includes(row.status)).length;
  const resolved = rows.filter((row) => row.status === "resolved").length;

  return <>
    <PageHeader title="Solicitações e Atendimento" description="Abra e acompanhe demandas acadêmicas, administrativas, de TI, infraestrutura, pessoas, documentos e transporte." action={<span className="badge">{roleLabels[account.role]}</span>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Solicitações" value={String(rows.length)} foot={canManage ? "Visíveis ao atendimento" : "Suas solicitações"} icon={TicketCheck}/>
      <StatCard label="Abertas" value={String(open)} foot="Aguardando triagem" icon={Clock3}/>
      <StatCard label="Em andamento" value={String(active)} foot="Atendimento ativo" icon={Headphones}/>
      <StatCard label="Resolvidas" value={String(resolved)} foot="Concluídas" icon={CircleCheckBig}/>
    </div>

    <SectionTitle title="Abrir solicitação" description="Descreva o pedido com informações suficientes para o setor responsável atender sem retrabalho."/>
    <section className="card panel">
      <form action={createServiceRequest} className="formStack">
        <div className="formRow2">
          <label>Categoria<select name="category" defaultValue="academic"><option value="academic">Acadêmico</option><option value="documents">Documentos</option><option value="people">Pessoas</option><option value="infrastructure">Infraestrutura</option><option value="it">Tecnologia</option><option value="transport">Transporte</option><option value="other">Outros</option></select></label>
          <label>Prioridade<select name="priority" defaultValue="normal"><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
        </div>
        <label>Título<input name="title" minLength={3} maxLength={180} required placeholder="Resuma o que precisa"/></label>
        <label>Descrição<textarea name="description" maxLength={8000} rows={5} placeholder="Explique o contexto, o que já tentou e o resultado esperado."/></label>
        <button className="button primary" type="submit"><Send size={16}/> Abrir solicitação</button>
      </form>
    </section>

    <SectionTitle title={canManage ? "Fila de atendimento" : "Minhas solicitações"} description={canManage ? "Atenda, encaminhe e responda solicitações autorizadas por RLS." : "Acompanhe mudanças de status e respostas do atendimento."}/>
    <div className="requestGrid">
      {rows.length === 0 && <div className="emptyState card"><MessageSquareText size={28}/><h2>Nenhuma solicitação</h2><p>Quando uma demanda for aberta, ela aparecerá aqui.</p></div>}
      {rows.map((row) => {
        const requester = people.get(row.requester_user_id);
        const assigned = row.assigned_to ? people.get(row.assigned_to) : null;
        return <article className="card requestCard" key={row.id}>
          <div className="requestHead"><div><span className="badge">{categoryLabels[row.category] ?? row.category}</span><h3>{row.title}</h3><small>{formatDate(row.created_at)}{canManage && requester ? ` • ${requester.full_name || requester.institutional_email}` : ""}</small></div><span className="badge">{statusLabels[row.status] ?? row.status}</span></div>
          <div className="requestMeta"><span className="badge">Prioridade: {priorityLabels[row.priority] ?? row.priority}</span>{assigned && <span className="badge">Responsável: {assigned.full_name || assigned.institutional_email}</span>}</div>
          {row.description && <p className="requestBody">{row.description}</p>}
          {row.response && <div className="infoBox"><b>Resposta do atendimento</b><br/>{row.response}</div>}

          {canManage ? <form action={manageServiceRequest} className="formStack requestManager">
            <input type="hidden" name="id" value={row.id}/>
            <div className="formRow2"><label>Status<select name="status" defaultValue={row.status}><option value="open">Aberta</option><option value="in_progress">Em atendimento</option><option value="waiting">Aguardando</option><option value="resolved">Resolvida</option><option value="cancelled">Cancelada</option></select></label><label>Responsável<select name="assignedTo" defaultValue={row.assigned_to ?? ""}><option value="">Não atribuído</option>{staffOptions.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</select></label></div>
            <label>Resposta / andamento<textarea name="response" maxLength={8000} defaultValue={row.response ?? ""} rows={3}/></label>
            <button className="button soft" type="submit">Salvar atendimento</button>
          </form> : (["open", "waiting"].includes(row.status) && <form action={cancelServiceRequest} className="requestActions"><input type="hidden" name="id" value={row.id}/><button className="button soft" type="submit">Cancelar solicitação</button></form>)}
        </article>;
      })}
    </div>
  </>;
}
