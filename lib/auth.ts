import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "teacher" | "staff" | "manager" | "admin";
export type AccountStatus = "active" | "pending" | "suspended";

export const roleLabels: Record<AppRole, string> = {
  student: "Estudante",
  teacher: "Professor",
  staff: "Servidor",
  manager: "Gestor",
  admin: "Administrador Geral",
};

export type CurrentAccount = {
  id: string;
  email: string;
  fullName: string;
  campus: string;
  avatarUrl: string | null;
  role: AppRole;
  accountStatus: AccountStatus;
  isGeneralAdmin: boolean;
};

export async function getCurrentAccount(): Promise<CurrentAccount | null> {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (error || !claims?.sub) return null;

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,campus,avatar_url,account_status")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role,is_general_admin")
      .eq("user_id", claims.sub)
      .maybeSingle(),
  ]);

  const role = (roleRow?.role ?? "student") as AppRole;
  const email = typeof claims.email === "string" ? claims.email : "";
  const fallbackName = email ? email.split("@")[0] : "Usuário";

  return {
    id: claims.sub,
    email,
    fullName: profile?.full_name?.trim() || fallbackName,
    campus: profile?.campus?.trim() || "Campus Cáceres",
    avatarUrl: profile?.avatar_url ?? null,
    role,
    accountStatus: (profile?.account_status ?? "pending") as AccountStatus,
    isGeneralAdmin: Boolean(roleRow?.is_general_admin),
  };
}

export async function requireAccount() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.accountStatus === "suspended") redirect("/acesso-negado?reason=suspended");
  if (account.accountStatus === "pending") redirect("/acesso-negado?reason=pending");
  return account;
}

export function canAccess(role: AppRole, allowed: AppRole[]) {
  return allowed.includes(role);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SF";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}
