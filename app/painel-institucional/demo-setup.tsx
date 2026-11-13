"use client";

import { useState } from "react";
import { prepareSifcasDemo, type DemoSetupResult } from "./demo-actions";

export default function DemoSetup() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DemoSetupResult | null>(null);

  async function activate() {
    setBusy(true);
    setResult(null);
    try {
      let last = 70;
      for (let round = 0; round < 12; round++) {
        const next = await prepareSifcasDemo();
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
    <button type="button" className="button primary" onClick={activate} disabled={busy} aria-busy={busy}>
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
      <p><small>Copie a senha agora. Ela muda se você executar a ativação novamente.</small></p>
      <p>Aulas: {result.academic.sessions ?? 0} · Avaliações: {result.academic.assessments ?? 0} · Notas: {result.academic.grades ?? 0} · Frequências: {result.academic.attendance ?? 0}</p>
    </div>}
  </section>;
}
