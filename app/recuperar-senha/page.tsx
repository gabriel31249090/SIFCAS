import Link from "next/link";
import { requestPasswordReset } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RecoverPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  return <div className="authOverlay"><div className="authBackdrop"/><main className="singleAuthCard"><section className="authCard"><div className="authCardHeader"><span className="authMobileLogo">S</span><h2>Recuperar senha</h2><p>Informe seu e-mail e enviaremos um link de recuperação.</p></div>{message && <div className="authAlert success">{message}</div>}<form action={requestPasswordReset} className="authForm"><label>E-mail<input name="email" type="email" autoComplete="email" required/></label><button className="authPrimary" type="submit">Enviar instruções</button></form><Link className="authBackLink" href="/login">← Voltar ao login</Link></section></main></div>;
}
