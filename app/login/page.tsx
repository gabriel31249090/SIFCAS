import Link from "next/link";
import { BookOpenCheck, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { login, signup } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = textParam(params.error);
  const message = textParam(params.message);
  const next = textParam(params.next) || "/";

  return (
    <div className="authOverlay">
      <div className="authBackdrop" />
      <main className="authLayout">
        <section className="authIntro">
          <div className="authBrand"><span>S</span><div><strong>SIFCAS</strong><small>Sistema Integrado Federal de Campus, Administração e Serviços</small></div></div>
          <div className="authIntroContent">
            <span className="authEyebrow">Portal integrado IFMT</span>
            <h1>Uma conta. Toda a sua vida institucional.</h1>
            <p>Acesse serviços acadêmicos, documentos, agendas, editais e informações do campus em uma experiência única.</p>
            <div className="authFeatures">
              <div><GraduationCap size={20}/><span><b>Estudantes</b><small>Notas, frequência, agenda e documentos.</small></span></div>
              <div><BookOpenCheck size={20}/><span><b>Professores</b><small>Turmas, ensino e planejamento acadêmico.</small></span></div>
              <div><Building2 size={20}/><span><b>Servidores</b><small>Serviços e rotinas administrativas.</small></span></div>
              <div><ShieldCheck size={20}/><span><b>Acesso protegido</b><small>Permissões por papel e dados isolados por usuário.</small></span></div>
            </div>
          </div>
        </section>

        <section className="authCard">
          <div className="authCardHeader"><span className="authMobileLogo">S</span><h2>Entrar no SIFCAS</h2><p>Use sua conta para continuar.</p></div>
          {error && <div className="authAlert error" role="alert">{error}</div>}
          {message && <div className="authAlert success" role="status">{message}</div>}

          <form action={login} className="authForm">
            <input type="hidden" name="next" value={next}/>
            <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required/></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" placeholder="••••••••" minLength={8} required/></label>
            <div className="authFormMeta"><Link href="/recuperar-senha">Esqueci minha senha</Link></div>
            <button className="authPrimary" type="submit">Entrar</button>
          </form>

          <div className="authDivider"><span>Primeiro acesso?</span></div>

          <details className="signupBox" open={params.mode === "cadastro"}>
            <summary>Criar uma conta</summary>
            <form action={signup} className="authForm compact">
              <label>Nome completo<input name="fullName" type="text" autoComplete="name" minLength={2} required/></label>
              <label>E-mail<input name="email" type="email" autoComplete="email" required/></label>
              <label>Crie uma senha<input name="password" type="password" autoComplete="new-password" minLength={8} required/></label>
              <button className="authSecondary" type="submit">Criar conta</button>
            </form>
          </details>

          <p className="authFootnote">Ao entrar, o SIFCAS aplica as permissões correspondentes ao seu vínculo institucional.</p>
        </section>
      </main>
    </div>
  );
}
