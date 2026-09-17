import Link from "next/link";
import { Bell, Search, Grid2X2, LogIn } from "lucide-react";
import { getCurrentAccount, initials, roleLabels } from "@/lib/auth";

export async function Topbar() {
  const account = await getCurrentAccount();

  return (
    <header className="topbar">
      <label className="globalSearch">
        <Search size={18}/><input aria-label="Busca global" placeholder="Buscar serviços, documentos, cursos, pessoas..."/>
        <kbd>Ctrl K</kbd>
      </label>
      <div className="topActions">
        <button aria-label="Aplicativos"><Grid2X2 size={18}/></button>
        <button aria-label="Notificações"><Bell size={18}/></button>
        {account ? (
          <Link className="userChip" href="/perfil"><span className="avatar">{initials(account.fullName)}</span><span><strong>{account.fullName}</strong><small>{roleLabels[account.role]}</small></span></Link>
        ) : (
          <Link className="userChip loginChip" href="/login"><span className="avatar"><LogIn size={15}/></span><span><strong>Entrar</strong><small>Acessar conta</small></span></Link>
        )}
      </div>
    </header>
  );
}
