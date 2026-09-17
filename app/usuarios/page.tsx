import { redirect } from "next/navigation";
import { Search, ShieldCheck, UserCheck, UserCog, UserX, UsersRound } from "lucide-react";
import { PageHeader, StatCard } from "@/components/UI";
import { requireAccount, roleLabels, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setAccountStatus, setUserRole } from "./actions";

type Params = Promise<{ q?: string; message?: string; error?: string }>;
const roleOptions: Array<[AppRole, string]> = Object.entries(roleLabels) as Array<[AppRole, string]>;

export default async function UsersPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (account.role !== "admin") redirect("/acesso-negado");
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase("pt-BR");
  const supabase = await createClient();

  const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,institutional_email,campus,account_status,created_at").order("full_name"),
    supabase.from("user_roles").select("user_id,role,is_general_admin"),
  ]);
  if (profileError || roleError) throw profileError ?? roleError;

  const roleMap = new Map((roles ?? []).map((row) => [row.user_id, row]));
  const all = (profiles ?? []).map((profile) => ({ ...profile, roleRow: roleMap.get(profile.id) }));
  const filtered = query ? all.filter((row) => [row.full_name ?? "", row.institutional_email ?? "", row.campus ?? "", row.roleRow?.role ?? ""].join(" ").toLocaleLowerCase("pt-BR").includes(query)) : all;
  const active = all.filter((row) => row.account_status === "active").length;
  const suspended = all.filter((row) => row.account_status === "suspended").length;
  const admins = all.filter((row) => row.roleRow?.role === "admin").length;

  return <>
    <PageHeader title="Usuários e Permissões" description="Administração central de papéis institucionais e status das contas. Alterações críticas são registradas na auditoria." action={<span className="badge"><ShieldCheck size={13}/> Administrador</span>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Contas" value={String(all.length)} foot="Perfis cadastrados" icon={UsersRound}/>
      <StatCard label="Ativas" value={String(active)} foot="Acesso normal" icon={UserCheck}/>
      <StatCard label="Suspensas" value={String(suspended)} foot="Acesso interno bloqueado" icon={UserX}/>
      <StatCard label="Administradores" value={String(admins)} foot="Papel admin" icon={UserCog}/>
    </div>

    <section className="card panel" style={{ marginTop: 18 }}>
      <form method="get" className="globalSearch" style={{ maxWidth: "100%" }}><Search size={18}/><input name="q" defaultValue={params.q ?? ""} placeholder="Buscar por nome, e-mail, campus ou papel"/><button className="button soft" type="submit">Buscar</button></form>
    </section>

    <section className="card panel" style={{ marginTop: 18 }}>
      <div className="tableScroll"><table className="dataTable"><thead><tr><th>Usuário</th><th>Campus</th><th>Papel</th><th>Status</th><th>Controles</th></tr></thead><tbody>
        {filtered.map((row) => {
          const role = (row.roleRow?.role ?? "student") as AppRole;
          const general = Boolean(row.roleRow?.is_general_admin);
          return <tr key={row.id}>
            <td><b>{row.full_name || "Sem nome"}</b><br/><small>{row.institutional_email || "Sem e-mail sincronizado"}</small>{general && <><br/><span className="badge">ADM Geral</span></>}</td>
            <td>{row.campus || "—"}</td>
            <td>{roleLabels[role]}</td>
            <td><span className="badge">{row.account_status === "suspended" ? "Suspensa" : "Ativa"}</span></td>
            <td><div className="accountControls">
              <form action={setUserRole}><input type="hidden" name="userId" value={row.id}/><select name="role" defaultValue={role} disabled={general}>{roleOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button className="button soft" type="submit" disabled={general}>Salvar papel</button></form>
              <form action={setAccountStatus}><input type="hidden" name="userId" value={row.id}/><input type="hidden" name="status" value={row.account_status === "suspended" ? "active" : "suspended"}/><button className="button soft" type="submit" disabled={general || row.id === account.id}>{row.account_status === "suspended" ? "Reativar" : "Suspender"}</button></form>
            </div></td>
          </tr>;
        })}
      </tbody></table></div>
      {filtered.length === 0 && <div className="infoBox">Nenhuma conta corresponde à busca.</div>}
    </section>
  </>;
}
