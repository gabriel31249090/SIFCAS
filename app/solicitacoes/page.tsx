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
    <PageHeader title="Solicitações e Atendimento" description="Registre uma solicitação no SIFCAS e acompanhe as atualizações disponíveis nesta página." action={<span className="badge">{roleLabels[account.role]}</span>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Solicitações" value={String(rows.length)} foot={canManage ? "Visíveis ao atendimento" : "Suas solicitações"} icon={TicketCheck}/>
      <StatCard label="Abertas" value={String(open)} foot="Aguardando triagem" icon={Clock3}/>
      <StatCard label="Em andamento" value={String(active)} foot="Atendimento ativo" icon={Headphones}/>
      <StatCard label="Resolvidas" value={String(resolved)} foot="Concluídas" icon={CircleCheckBig}/>
    </div>

    <SectionTitle title="Abrir solicitação" description="Informe o contexto para que a equipe autorizada do SIFCAS possa avaliar o pedido."/>
    <section className="card panel">
      <div className="infoBox" role="note">
        <b>Encaminhamento institucional ainda não configurado.</b> A categoria classifica o pedido, mas não escolhe nem notifica um setor do campus. O formulário registra a solicitação no SIFCAS; ele não confirma que a administração ou a manutenção recebeu o aviso. Para uma ocorrência real, procure também o canal oficial do campus. Este canal não é para emergências.
        <p>Se o problema for no Campus Cáceres, consulte os <a href="https://cas.ifmt.edu.br/o-campus/" target="_blank" rel="noopener noreferrer">contatos oficiais do campus</a>; a página lista a Coordenação de Serviços Auxiliares. A correspondência entre este formulário e esse setor ainda não foi homologada.</p>
        <p>Para uma manifestação formal, consulte também a <a href="https://ifmt.edu.br/participacao-social/ouvidoria/" target="_blank" rel="noopener noreferrer">Ouvidoria do IFMT</a> e os canais oficiais nela indicados.</p>
      </div>
      <form action={createServiceRequest} className="formStack">
        <div className="formRow2">
          <label>Categoria<select name="category" defaultValue="academic"><option value="academic">Acadêmico</option><option value="documents">Documentos</option><option value="people">Pessoas</option><option value="infrastructure">Infraestrutura</option><option value="it">Tecnologia</option><option value="transport">Transporte</option><option value="other">Outros</option></select><small>A categoria não define um destinatário institucional.</small></label>
          <label>Prioridade<select name="priority" defaultValue="normal"><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
        </div>
        <label>Título<input name="title" minLength={3} maxLength={180} required placeholder="Resuma o que precisa"/></label>
        <label>Campus e local exato <small>Obrigatório para ocorrências de infraestrutura.</small><input name="location" maxLength={240} placeholder="Ex.: Campus Cáceres, bloco e andar, perto do bebedouro"/></label>
        <label>Descrição<textarea name="description" maxLength={7600} rows={5} placeholder="Explique o problema, quando começou e o que já tentou."/></label>
        <button className="button primary" type="submit"><Send size={16}/> Abrir solicitação</button>
      </form>
    </section>

    <SectionTitle title={canManage ? "Fila de atendimento do SIFCAS" : "Minhas solicitações"} description={canManage ? "Revise os pedidos disponíveis, atribua uma pessoa responsável e registre o andamento. A atribuição não encaminha o pedido a um setor externo." : "Acompanhe o status e as respostas registradas no SIFCAS; não há notificação externa configurada."}/>
    <div className="requestGrid">
      {rows.length === 0 && <div className="emptyState card"><MessageSquareText size={28}/><h2>Nenhuma solicitação</h2><p>Quando uma demanda for aberta, ela aparecerá aqui.</p></div>}
      {rows.map((row) => {
        const requester = people.get(row.requester_user_id);
        const assigned = row.assigned_to ? people.get(row.assigned_to) : null;
        return <article className="card requestCard" key={row.id}>
          <div className="requestHead"><div><span className="badge">{categoryLabels[row.category] ?? row.category}</span><h3>{row.title}</h3><small>Protocolo interno SIFCAS: {String(row.id).slice(0, 8).toUpperCase()} · {formatDate(row.created_at)}{canManage && requester ? ` • ${requester.full_name || requester.institutional_email}` : ""}</small></div><span className="badge">{statusLabels[row.status] ?? row.status}</span></div>
          <div className="requestMeta"><span className="badge">Prioridade: {priorityLabels[row.priority] ?? row.priority}</span><span className="badge">Responsável: {assigned ? assigned.full_name || assigned.institutional_email : "Não atribuído"}</span></div>
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
