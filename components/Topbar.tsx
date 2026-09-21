import Link from "next/link";
import { Bell, Sparkles, LogIn } from "lucide-react";
import { getCurrentAccount, initials, roleLabels } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/institutional";
import { GlobalSearch } from "./GlobalSearch";
import { PageLocation } from "./PageLocation";

export async function Topbar() {
  const account = await getCurrentAccount();
  const active = account?.accountStatus === "active";
  const unreadCount = account && active ? await getUnreadNotificationCount(account.id) : 0;
  const blockedPath = "/acesso-negado?reason=" + (account?.accountStatus === "suspended" ? "suspended" : "pending");
  return <header className="topbar">
    <PageLocation />
    <GlobalSearch />
    <div className="topActions">
      <Link className="iconAction maisaAction" href={account ? (active ? "/maisa" : blockedPath) : "/login?next=/maisa"} aria-label="Abrir MAISA" title="MAISA"><Sparkles size={20} /></Link>
      <Link className="iconAction notificationAction" href={account ? (active ? "/notificacoes" : blockedPath) : "/login?next=/notificacoes"} aria-label={unreadCount ? unreadCount + " notificações não lidas" : "Abrir notificações"} title="Notificações"><Bell size={20} />{unreadCount > 0 && <span className="notificationCount">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
      {account ? <Link className={"userChip " + (!active ? "suspendedChip" : "")} href={active ? "/perfil" : blockedPath}>
        <span className="avatar">{initials(account.fullName)}</span>
        <span><strong>{account.fullName}</strong><small>{account.accountStatus === "suspended" ? "Conta suspensa" : account.accountStatus === "pending" ? "Vínculo pendente" : roleLabels[account.role]}</small></span>
      </Link> : <Link className="userChip loginChip" href="/login"><span className="avatar"><LogIn size={18} /></span><span><strong>Entrar</strong><small>Acessar conta</small></span></Link>}
    </div>
  </header>;
}
