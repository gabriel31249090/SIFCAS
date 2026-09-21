import Link from "next/link";
import { ArrowUpRight, GraduationCap, BookOpenCheck, Building2, LockKeyhole, Mail } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { safeInternalPath } from "@/lib/safe-path";
import { login, signup } from "./actions";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const textParam = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = textParam(params.error);
  const message = textParam(params.message);
  return <div className="authOverlay">
    <main className="authLayout">
      <section className="authIntro">
        <Link className="authBrand" href="/noticias" aria-label="SIFCAS, portal público"><Brand /></Link>
        <div className="authIntroContent">
          <span className="authEyebrow">IFMT · Campus Cáceres</span>
          <h1>Seu campus.<br /><span>Mais perto.</span></h1>
          <p>A vida acadêmica tem muitos caminhos.<br />Aqui, eles se encontram.</p>
          <div className="authFeatures">
            <div><span className="authFeatureIcon"><GraduationCap size={24} /></span><span><b>Para aprender</b><small>Agenda, notas e documentos.</small></span></div>
            <div><span className="authFeatureIcon"><BookOpenCheck size={24} /></span><span><b>Para ensinar</b><small>Turmas, aulas e acompanhamento.</small></span></div>
            <div><span className="authFeatureIcon"><Building2 size={24} /></span><span><b>Para fazer acontecer</b><small>Serviços e rotinas do campus.</small></span></div>
          </div>
        </div>
        <div className="authIntroFooter"><span>Conhecimento conecta.</span><span>SIFCAS</span></div>
      </section>
      <section className="authEntry">
        <div className="authPublicLink"><span>Explorar sem entrar</span><Link href="/noticias">Portal público<ArrowUpRight size={17} /></Link></div>
        <div className="authCard">
          <div className="authSmallBrand"><Brand /></div>
          <div className="authCardHeader"><span className="sectionEyebrow">SEU ESPAÇO NO CAMPUS</span><h2>Bom ter você aqui.</h2><p>Entre na sua conta para continuar.</p></div>
          {error && <div className="authAlert error" role="alert">{error}</div>}
          {message && <div className="authAlert success" role="status">{message}</div>}
          <form action={login} className="authForm">
            <input type="hidden" name="next" value={safeInternalPath(textParam(params.next))} />
            <label>E-mail<div className="authInputWrap"><Mail size={18} aria-hidden="true" /><input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required /></div></label>
            <PasswordInput />
            <div className="authFormMeta"><Link href="/recuperar-senha">Esqueci minha senha</Link></div>
            <SubmitButton pendingLabel="Entrando…">Entrar no SIFCAS</SubmitButton>
          </form>
          <div className="authDivider"><span>Primeiro acesso?</span></div>
          <details className="signupBox" open={params.mode === "cadastro"}>
            <summary>Criar minha conta</summary>
            <form action={signup} className="authForm compact">
              <label>Nome completo<input name="fullName" type="text" autoComplete="name" minLength={2} maxLength={160} required /></label>
              <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
              <PasswordInput label="Crie uma senha" autoComplete="new-password" />
              <SubmitButton className="authSecondary" pendingLabel="Criando conta…">Criar conta</SubmitButton>
            </form>
          </details>
          <p className="authFootnote"><LockKeyhole size={15} aria-hidden="true" />O acesso interno depende da confirmação do e-mail e da validação do vínculo institucional.</p>
        </div>
        <footer className="authEntryFooter">Sistema Integrado Federal de Campus,<br />Administração e Serviços</footer>
      </section>
    </main>
  </div>;
}
