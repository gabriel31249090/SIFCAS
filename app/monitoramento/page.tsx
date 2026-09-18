import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Archive, Bot, Database, FileCheck2, HardDrive, ShieldAlert } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getDifyConfig } from "@/lib/dify";
import { createClient } from "@/lib/supabase/server";

export default async function MonitoringPage() {
  const account = await requireAccount();
  if (!["manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const supabase = await createClient();
  const dify = getDifyConfig();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [healthRes, openRequests, audit24h, attachments, suspended, published] = await Promise.all([
    supabase.rpc("sifcas_health"),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "waiting"]),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("publication_attachments").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase.from("institutional_publications").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const databaseOk = !healthRes.error && Boolean(healthRes.data);

  return <>
    <PageHeader title="Monitoramento e Produção" description="Visão operacional do banco, Storage, auditoria, atendimento e integração da MAISA." action={<span className="badge"><span className={\`statusDot \${databaseOk ? "" : "danger"}\`}/>{databaseOk ? "Banco online" : "Verificar banco"}</span>}/>

    <div className="statGrid">
      <StatCard label="Banco" value={databaseOk ? "OK" : "ERRO"} foot="RPC de saúde" icon={Database}/>
      <StatCard label="MAISA" value={dify.configured ? "OK" : "PENDENTE"} foot={dify.configured ? "Dify configurado no servidor" : "Variável DIFY_API_KEY ausente"} icon={Bot}/>
      <StatCard label="Demandas ativas" value={String(openRequests.count ?? 0)} foot="Abertas/em atendimento" icon={Activity}/>
      <StatCard label="Auditoria 24h" value={String(audit24h.count ?? 0)} foot="Eventos registrados" icon={FileCheck2}/>
    </div>

    <SectionTitle title="Indicadores de operação" description="Sinais rápidos para o administrador acompanhar o estado do SIFCAS."/>
    <div className="operationalGrid">
      <article className="card panel"><span className="mutedLabel">Publicações ativas</span><strong style={{ fontSize: 28 }}>{published.count ?? 0}</strong><p className="mutedLabel">Conteúdo institucional publicado.</p></article>
      <article className="card panel"><span className="mutedLabel">Contas suspensas</span><strong style={{ fontSize: 28 }}>{suspended.count ?? 0}</strong><p className="mutedLabel">Contas impedidas de acessar módulos internos.</p></article>
      <article className="card panel"><span className="mutedLabel">Storage</span><strong style={{ fontSize: 22 }}>Privado</strong><p className="mutedLabel">{attachments.count ?? 0} anexos com RLS e URLs assinadas.</p></article>
      <article className="card panel"><span className="mutedLabel">Assistente</span><strong style={{ fontSize: 22 }}>{dify.configured ? "Dify conectado" : "Configurar Dify"}</strong><p className="mutedLabel">A chave permanece somente no ambiente do servidor.</p></article>
    </div>

    <SectionTitle title="Checklist de produção" description="Itens internos estão aplicados; configurações externas que exigem Dashboard permanecem sinalizadas."/>
    <section className="card panel monitorChecklist">
      <div><FileCheck2 size={19}/><span><b>RLS + RBAC</b><small>Aplicados às tabelas acadêmicas, institucionais, solicitações, auditoria e anexos.</small></span></div>
      <div><Bot size={19}/><span><b>MAISA / Dify</b><small>{dify.configured ? "Chave de produção detectada no servidor. O navegador nunca recebe a credencial." : "Adicione DIFY_API_KEY em Production na Vercel."}</small></span></div>
      <div><Archive size={19}/><span><b>Backup lógico</b><small>O repositório inclui scripts de pg_dump. Em projeto Free, mantenha exportações regulares fora da plataforma.</small></span></div>
      <div><ShieldAlert size={19}/><span><b>Proteção de senha vazada</b><small>Ative “Leaked Password Protection” no Dashboard do Supabase Auth.</small></span></div>
      <div><ShieldAlert size={19}/><span><b>CAPTCHA e SMTP</b><small>Recomendados antes de abertura pública em larga escala; exigem provedor/chaves definidos pelo administrador.</small></span></div>
    </section>

    <div className="adminLinkGrid" style={{ marginTop: 18 }}>
      <Link className="card moduleCard" href="/maisa"><div className="moduleTop"><span className="iconBox"><Bot size={20}/></span></div><h3>Testar MAISA</h3><p>Abrir o chat institucional conectado ao Dify.</p></Link>
      <Link className="card moduleCard" href="/auditoria"><div className="moduleTop"><span className="iconBox"><FileCheck2 size={20}/></span></div><h3>Abrir auditoria</h3><p>Ver alterações críticas e responsáveis.</p></Link>
      <Link className="card moduleCard" href="/solicitacoes"><div className="moduleTop"><span className="iconBox"><Activity size={20}/></span></div><h3>Fila de atendimento</h3><p>Acompanhar solicitações em andamento.</p></Link>
      <Link className="card moduleCard" href="/api/health"><div className="moduleTop"><span className="iconBox"><Database size={20}/></span></div><h3>Health endpoint</h3><p>Verificar banco e presença da configuração da MAISA.</p></Link>
    </div>
  </>;
}
