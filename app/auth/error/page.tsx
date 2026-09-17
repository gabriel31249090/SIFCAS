import Link from "next/link";

export default function AuthErrorPage() {
  return <section className="centerState card"><span className="stateIcon">!</span><h1>Não foi possível concluir a autenticação</h1><p>O link pode ter expirado ou já ter sido utilizado. Você pode tentar entrar novamente ou solicitar um novo link.</p><div className="stateActions"><Link className="button primary" href="/login">Voltar ao login</Link><Link className="button" href="/recuperar-senha">Recuperar senha</Link></div></section>;
}
