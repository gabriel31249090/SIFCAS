import Link from "next/link";

export default async function AccessDeniedPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const params = await searchParams;
  const suspended = params.reason === "suspended";
  return <section className="centerState card"><span className="stateIcon lock">×</span><h1>{suspended ? "Conta suspensa" : "Acesso restrito"}</h1><p>{suspended ? "Esta conta está temporariamente impedida de acessar os módulos internos do SIFCAS. Entre em contato com a administração para regularizar o acesso." : "Seu vínculo atual não possui permissão para abrir este módulo. O papel institucional é administrado separadamente do seu perfil pessoal."}</p><div className="stateActions"><Link className="button primary" href="/">Voltar ao início</Link>{!suspended && <Link className="button" href="/perfil">Ver meu perfil</Link>}{suspended && <Link className="button" href="/auth/signout">Sair da conta</Link>}</div></section>;
}
