import { redirect } from "next/navigation";
import { Search, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { PageHeader, StatCard } from "@/components/UI";
import { requireAccount, roleLabels, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ q?: string }>;

export default async function PeoplePage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (!["staff", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLocaleLowerCase("pt-BR");
  const supabase = await createClient();

  const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,institutional_email,campus,account_status").eq("account_status", "active").order("full_name"),
    supabase.from("user_roles").select("user_id,role,is_general_admin"),
  ]);
  if (profileError || roleError) throw profileError ?? roleError;

  const roleMap = new Map((roles ?? []).map((row) => [row.user_id, row]));
  const directory = (profiles ?? []).map((profile) => ({ ...profile, roleRow: roleMap.get(profile.id) })).filter((row) => row.roleRow?.role && row.roleRow.role !== "student");
  const filtered = q ? directory.filter((row) => [row.full_name ?? "", row.institutional_email ?? "", row.campus ?? "", row.roleRow?.role ?? ""].join(" ").toLocaleLowerCase("pt-BR").includes(q)) : directory;
  const teachers = directory.filter((row) => row.roleRow?.role === "teacher").length;
  const staff = directory.filter((row) => ["staff", "manager", "admin"].includes(row.roleRow?.role ?? "")).length;

  return <>
    <PageHeader title="Diretório de Pessoas" description="Diretório institucional de professores, servidores, gestores e administradores cadastrados no SIFCAS." action={<span className="badge"><ShieldCheck size={13}/> acesso interno</span>}/>
    <div className="statGrid">
      <StatCard label="Pessoas" value={String(directory.length)} foot="No diretório" icon={Users}/>
      <StatCard label="Professores" value={String(teachers)} foot="Papel docente" icon={UserRoundCheck}/>
      <StatCard label="Gestão/servidores" value={String(staff)} foot="Papéis administrativos" icon={ShieldCheck}/>
      <StatCard label="Campus" value={String(new Set(directory.map((row) => row.campus).filter(Boolean)).size)} foot="Representados" icon={Users}/>
    </div>

    <section className="card panel" style={{ marginTop: 18 }}><form method="get" className="globalSearch" style={{ maxWidth: "100%" }}><Search size={18}/><input name="q" defaultValue={params.q ?? ""} placeholder="Buscar nome, e-mail, campus ou papel"/><button className="button soft" type="submit">Buscar</button></form></section>

    <div className="directoryGrid" style={{ marginTop: 18 }}>
      {filtered.map((row) => {
        const role = (row.roleRow?.role ?? "staff") as AppRole;
        return <article className="card directoryCard" key={row.id}><span className="badge">{roleLabels[role]}</span><h3>{row.full_name || "Sem nome"}</h3><p>{row.institutional_email || "E-mail não sincronizado"}</p><small>{row.campus || "Campus não informado"}</small><div className="directoryMeta">{row.roleRow?.is_general_admin && <span className="badge">ADM Geral</span>}</div></article>;
      })}
      {filtered.length === 0 && <div className="infoBox">Nenhuma pessoa encontrada.</div>}
    </div>
  </>;
}
