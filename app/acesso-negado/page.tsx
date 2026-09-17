import Link from "next/link";

export default function AccessDeniedPage() {
  return <section className="centerState card"><span className="stateIcon lock">×</span><h1>Acesso restrito</h1><p>Seu vínculo atual não possui permissão para abrir este módulo. O papel institucional é administrado separadamente do seu perfil pessoal.</p><div className="stateActions"><Link className="button primary" href="/">Voltar ao início</Link><Link className="button" href="/perfil">Ver meu perfil</Link></div></section>;
}
