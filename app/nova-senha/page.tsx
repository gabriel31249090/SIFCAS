import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth";
import { NEW_PASSWORD_MAX_LENGTH, NEW_PASSWORD_MIN_LENGTH } from "@/lib/password-policy";
import { updatePassword } from "./actions";

export const metadata: Metadata = {
  title: "Definir nova senha",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAccount();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  return <section className="pageSection narrow"><header className="pageHeader"><div><span className="eyebrow">Segurança</span><h1>Definir nova senha</h1><p>Escolha uma senha longa, única e com pelo menos {NEW_PASSWORD_MIN_LENGTH} caracteres.</p></div></header><div className="card profilePanel">{error && <div className="authAlert error">{error}</div>}<form action={updatePassword} className="authForm"><label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={NEW_PASSWORD_MIN_LENGTH} maxLength={NEW_PASSWORD_MAX_LENGTH} required/></label><button className="authPrimary" type="submit">Salvar nova senha</button></form></div></section>;
}
