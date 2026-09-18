import Link from "next/link";
import { Bell, Bug, Link2, LockKeyhole, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { initials, requireAccount, roleLabels } from "@/lib/auth";
import { updateProfile } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  return <section className="pageSection">
    <header className="pageHeader"><div><span className="eyebrow">Minha conta</span><h1>Perfil e segurança</h1><p>Seus dados pessoais ficam separados das permissões institucionais.</p></div></header>
    <div className="profileGrid">
      <aside className="card profileIdentity">
        <div className="profileAvatar">{initials(account.fullName)}</div><h2>{account.fullName}</h2><span className="roleBadge"><ShieldCheck size={14}/>{roleLabels[account.role]}</span>
        <div className="identityMeta"><span><Mail size={16}/>{account.email || "E-mail não disponível"}</span><span><MapPin size={16}/>{account.campus}</span></div>
        <form action="/auth/signout" method="post"><button className="button dangerOutline" type="submit">Sair da conta</button></form>
      </aside>
      <div className="card profilePanel">
        <div className="panelHeading"><UserRound size={20}/><div><h2>Dados pessoais</h2><p>Você pode alterar seu nome. Campus e papel institucional são controlados pela instituição.</p></div></div>
        {message && <div className="authAlert success">{message}</div>}{error && <div className="authAlert error">{error}</div>}
        <form action={updateProfile} className="profileForm">
          <label>Nome completo<input name="fullName" defaultValue={account.fullName} minLength={2} maxLength={120} required/></label>
          <div className="readonlyGrid"><label>E-mail<input value={account.email} readOnly/></label><label>Campus<input value={account.campus} readOnly/></label><label>Papel institucional<input value={roleLabels[account.role]} readOnly/></label></div>
          <button className="button primary" type="submit">Salvar alterações</button>
        </form>
        <div className="securityBlock"><LockKeyhole size={20}/><div><h3>Senha</h3><p>Altere sua senha usando o fluxo seguro de recuperação.</p></div><Link className="button" href="/recuperar-senha">Alterar senha</Link></div>
        <div className="profileTools">
          <Link href="/preferencias-notificacoes"><Bell size={17}/><span><b>Notificações</b><small>Escolher categorias</small></span></Link>
          <Link href="/atalhos"><Link2 size={17}/><span><b>Meus atalhos</b><small>Personalizar início</small></span></Link>
          <Link href="/reportar-erro"><Bug size={17}/><span><b>Reportar erro</b><small>Acompanhar problema</small></span></Link>
        </div>
      </div>
    </div>
  </section>;
}
