"use client";

import { useState } from "react";
import { prepareSifcasDemo, type DemoSetupResult } from "./demo-actions";

export default function DemoSetup() {
  const [busy, setBusy] = useState(false);
  const [testPassword, setTestPassword] = useState("");
  const [result, setResult] = useState<DemoSetupResult | null>(null);

  async function activate() {
    setBusy(true);
    setResult(null);
    try {
      let last = 70;
      for (let round = 0; round < 12; round++) {
        const next = await prepareSifcasDemo(testPassword);
        setResult(next);
        if (next.state !== "progress") break;
        if (next.remaining >= last && round > 0) {
          setResult({ state: "error", message: "A sincronização parou de avançar. Verifique o Supabase Auth." });
          break;
        }
        last = next.remaining;
      }
    } catch {
      setResult({ state: "error", message: "Não foi possível completar a configuração. Verifique a sessão e os logs do servidor." });
    } finally {
      setBusy(false);
    }
  }

  return <section className="card panel" aria-labelledby="demo-setup-title" style={{ marginBottom: 20 }}>
    <h2 id="demo-setup-title">Ambiente de demonstração acadêmica</h2>
    <p>Ative 50 estudantes, 11 professores, 8 servidores e preencha turmas, aulas, avaliações, frequências e notas fictícias nos módulos existentes.</p>
    <p><small>Todos os registros são sintéticos, separados por identificadores DEMO, e não representam documentos ou resultados oficiais do IFMT. A operação não altera contas reais.</small></p>
    <label style={{ display: "block", marginBottom: 12 }}>Senha do Professor Teste
      <input type="password" value={testPassword} minLength={8} maxLength={72} autoComplete="new-password"
        onChange={(event) => setTestPassword(event.target.value)}
        placeholder="Digite a senha desejada para o login de teste"
        disabled={busy} style={{ display: "block", width: "100%", maxWidth: 380, marginTop: 6 }}/>
      <small>A senha será aplicada somente à conta fictícia de professor. Evite reutilizar senhas pessoais.</small>
    </label>
    <button type="button" className="button primary" onClick={activate}
      disabled={busy || testPassword.length < 8 || testPassword.length > 72} aria-busy={busy}>
      {busy ? "Criando contas e diários..." : "Ativar demonstração completa"}
    </button>
    {result?.state === "progress" && <p role="status">Contas ativadas: {result.done}/{result.total}. Restantes: {result.remaining}.</p>}
    {result?.state === "error" && <p role="alert" className="infoBox errorBox">{result.message}</p>}
    {result?.state === "finished" && <div className="infoBox successBox" role="status">
      <p><strong>Dados de demonstração ativados.</strong> {result.done} contas sincronizadas.</p>
      <p><strong>Login:</strong> <code>{result.email}</code></p>
      <p><strong>Senha temporária:</strong> <code>{result.password}</code></p>
      <button type="button" className="button soft" onClick={() => void navigator.clipboard.writeText(result.password)}>
        Copiar senha
      </button>
      <p><small>A senha será mantida enquanto você não a alterar ou executar a ativação com outra senha.</small></p>
      <p>Aulas: {result.academic.sessions ?? 0} · Avaliações: {result.academic.assessments ?? 0} · Notas: {result.academic.grades ?? 0} · Frequências: {result.academic.attendance ?? 0} · Atividades: {result.extras.agenda ?? 0} · Comunicados em rascunho: {result.extras.draft_notices ?? 0}</p>
    </div>}
  </section>;
}
