import Link from "next/link";
import { Bell, Bot, Grid2X2, LogIn } from "lucide-react";
import { getCurrentAccount, initials, roleLabels } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/institutional";
import { GlobalSearch } from "./GlobalSearch";

export async function Topbar() {
  const account = await getCurrentAccount();
  const unreadCount = account && account.accountStatus === "active" ? await getUnreadNotificationCount(account.id) : 0;

  return (
    <header className="topbar">
      <GlobalSearch/>
      <div className="topActions">
        <Link className="iconAction" href="/aplicativos" aria-label="Abrir aplicativos" title="Aplicativos"><Grid2X2 size={18}/></Link>
        <Link className="iconAction" href={account ? (account.accountStatus === "active" ? "/maisa" : "/acesso-negado?reason=suspended") : "/login?next=/maisa"} aria-label="Abrir MAISA" title="MAISA"><Bot size={18}/></Link>
        <Link className="iconAction notificationAction" href={account ? (account.accountStatus === "active" ? "/notificacoes" : "/acesso-negado?reason=suspended") : "/login?next=/notificacoes"} aria-label="Abrir notificações" title="Notificações">
          <Bell size={18}/>{unreadCount > 0 && <span className="notificationCount">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>
        {account ? (
          <Link className={`userChip ${account.accountStatus === "suspended" ? "suspendedChip" : ""}`} href={account.accountStatus === "suspended" ? "/acesso-negado?reason=suspended" : "/perfil"}>
            <span className="avatar">{initials(account.fullName)}</span>
            <span><strong>{account.fullName}</strong><small>{account.accountStatus === "suspended" ? "Conta suspensa" : roleLabels[account.role]}</small></span>
          </Link>
        ) : (
          <Link className="userChip loginChip" href="/login"><span className="avatar"><LogIn size={15}/></span><span><strong>Entrar</strong><small>Acessar conta</small></span></Link>
        )}
      </div>
    </header>
  );
}
