import { redirect } from "next/navigation";
import { Activity, Database, FileClock, ShieldCheck } from "lucide-react";
import { PageHeader, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ entity?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function AuditPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (!["manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("id,actor_user_id,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(250);
  if (params.entity) query = query.eq("entity_type", params.entity);
  const { data: logs, error } = await query;
  if (error) throw error;

  const actorIds = [...new Set((logs ?? []).map((row) => row.actor_user_id).filter(Boolean) as string[])];
  const { data: profiles } = actorIds.length ? await supabase.from("profiles").select("id,full_name,institutional_email").in("id", actorIds) : { data: [] };
  const actorMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name || row.institutional_email || "Usuário"]));
  const now = Date.now();
  const last24 = (logs ?? []).filter((row) => now - new Date(row.created_at).getTime() <= 86400000).length;
  const entities = new Set((logs ?? []).map((row) => row.entity_type)).size;

  return <>
    <PageHeader title="Auditoria" description="Registro imutável das principais alterações acadêmicas, administrativas e institucionais executadas no SIFCAS." action={<span className="badge"><ShieldCheck size={13}/> acesso restrito</span>}/>
    <div className="statGrid">
      <StatCard label="Eventos carregados" value={String((logs ?? []).length)} foot="Últimos 250" icon={Activity}/>
      <StatCard label="Últimas 24h" value={String(last24)} foot="Alterações recentes" icon={FileClock}/>
      <StatCard label="Entidades" value={String(entities)} foot="Tipos auditados" icon={Database}/>
      <StatCard label="Retenção" value="Ativa" foot="Banco de auditoria" icon={ShieldCheck}/>
    </div>

    <section className="card panel" style={{ marginTop: 18 }}>
      <form method="get" className="formRow2"><label>Filtrar entidade<input name="entity" defaultValue={params.entity ?? ""} placeholder="Ex.: grades, user_roles, service_requests"/></label><div style={{ alignSelf: "end" }}><button className="button soft" type="submit">Aplicar filtro</button></div></form>
    </section>

    <div className="auditList" style={{ marginTop: 18 }}>
      {(logs ?? []).map((log) => <details className="card auditItem" key={log.id}>
        <summary className="auditTop"><span><b>{log.action.toUpperCase()} • {log.entity_type}</b><br/><small>{actorMap.get(log.actor_user_id) ?? "Sistema / usuário indisponível"} • {formatDate(log.created_at)}</small></span><span className="badge">{log.entity_id ?? "sem ID"}</span></summary>
        <pre>{JSON.stringify(log.details, null, 2)}</pre>
      </details>)}
      {(logs ?? []).length === 0 && <div className="infoBox">Nenhum evento de auditoria encontrado para o filtro informado.</div>}
    </div>
  </>;
}
