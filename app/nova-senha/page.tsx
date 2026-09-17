import { requireAccount } from "@/lib/auth";
import { updatePassword } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAccount();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  return <section className="pageSection narrow"><header className="pageHeader"><div><span className="eyebrow">Segurança</span><h1>Definir nova senha</h1><p>Escolha uma senha forte com pelo menos 8 caracteres.</p></div></header><div className="card profilePanel">{error && <div className="authAlert error">{error}</div>}<form action={updatePassword} className="authForm"><label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><button className="authPrimary" type="submit">Salvar nova senha</button></form></div></section>;
}
