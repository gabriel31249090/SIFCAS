"use client";

import { useState } from "react";
import {
  confirmDemoCleanup,
  previewDemoCleanup,
  type DemoCleanupResult,
} from "./demo-cleanup-actions";

const CONFIRM_TEXT = "EXCLUIR DADOS DEMO";

export default function DemoCleanup() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DemoCleanupResult | null>(null);
  const [phrase, setPhrase] = useState("");

  async function preview() {
    setBusy(true);
    setPhrase("");
    try {
      setResult(await previewDemoCleanup());
    } catch {
      setResult({ state: "error", message: "Não foi possível obter a prévia da exclusão." });
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (result?.state !== "preview" || !result.counts.safe || phrase !== CONFIRM_TEXT) return;
    const ticket = result.ticket;
    setBusy(true);
    try {
      for (let attempt = 0; attempt < 15; attempt++) {
        const next = await confirmDemoCleanup(ticket, phrase);
        setResult(next);
        if (next.state !== "progress") break;
        if (attempt === 14) {
          setResult({
            state: "error",
            message: "Processo interrompido após 15 lotes. Faça uma nova prévia para retomar com segurança.",
          });
        }
      }
    } catch {
      setResult({
        state: "error",
        message: "A conexão foi interrompida. Faça uma nova prévia e continue a limpeza; o processo é retomável.",
      });
    } finally {
      setBusy(false);
    }
  }

  const counts = result?.state === "preview" ? result.counts : null;
  return (
    <section className="card panel" aria-labelledby="demo-cleanup-title" style={{ marginBottom: 20 }}>
      <h2 id="demo-cleanup-title">Apagar dados fictícios do SIFCAS</h2>
      <p>
        Este controle é exclusivo do <strong>Administrador Geral</strong>. Ele remove apenas contas,
        turmas, notas, frequências, publicações e outros dados marcados como DEMO.
        As contas e os registros reais são preservados.
      </p>
      <div className="infoBox" role="note">
        <strong>Operação irreversível.</strong> Faça backup antes de excluir.
        Se a prévia encontrar qualquer relação com dados reais, a exclusão será bloqueada.
        O Professor Teste também será removido do login.
      </div>
      <button className="button soft" type="button" disabled={busy} onClick={() => void preview()}>
        {busy ? "Verificando..." : "Ver prévia da limpeza"}
      </button>
      {counts && (
        <div style={{ marginTop: 14 }}>
          <h3>Prévia: registros que serão excluídos</h3>
          <div className="statGrid" style={{ marginTop: 10 }}>
            {([
              ["Contas fictícias", counts.users],
              ["Turmas", counts.classes],
              ["Matrículas", counts.enrollments],
              ["Aulas", counts.sessions],
              ["Avaliações", counts.assessments],
              ["Notas", counts.grades],
              ["Frequências", counts.attendance],
              ["Eventos de turma", counts.calendar],
              ["Notícias/comunicados", counts.publications],
              ["Projetos", counts.projects],
              ["Artigos", counts.articles],
            ] as const).map(([label, value]) => (
              <div key={label} className="statCard" style={{ padding: 12 }}>
                <strong>{value.toLocaleString("pt-BR")}</strong>
                <small>{label}</small>
              </div>
            ))}
          </div>
          {counts.blockers.length > 0 && (
            <div className="infoBox errorBox" role="alert" style={{ marginTop: 12 }}>
              <strong>Limpeza bloqueada para proteger dados reais:</strong>
              <ul>{counts.blockers.map((problem) => <li key={problem}>{problem}</li>)}</ul>
            </div>
          )}
          {counts.safe && (
            <div style={{ marginTop: 14 }}>
              <p><strong>Para confirmar, digite exatamente:</strong> <code>{CONFIRM_TEXT}</code></p>
              <label style={{ display: "block", marginBottom: 10 }}>
                Frase de confirmação
                <input
                  type="text"
                  value={phrase}
                  onChange={(event) => setPhrase(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  style={{ display: "block", maxWidth: 390, width: "100%", marginTop: 6 }}
                  placeholder={CONFIRM_TEXT}
                />
              </label>
              <button
                type="button"
                className="button primary"
                disabled={busy || phrase !== CONFIRM_TEXT}
                onClick={() => void confirm()}
              >
                {busy ? "Excluindo dados de demonstração..." : "Confirmar exclusão dos dados DEMO"}
              </button>
            </div>
          )}
        </div>
      )}
      {result?.state === "progress" && (
        <p role="status" className="infoBox">
          Removidas {result.deleted} de {result.total} contas. Restam {result.remaining}.
          A limpeza está sendo concluída por etapas.
        </p>
      )}
      {result?.state === "error" && <p className="infoBox errorBox" role="alert">{result.message}</p>}
      {result?.state === "done" && (
        <p className="infoBox successBox" role="status">
          {result.deleted > 0
            ? "Limpeza concluída. Todos os registros DEMO previstos foram excluídos, sem remover as contas reais."
            : "Nenhum cadastro de demonstração permanece na base."}
        </p>
      )}
    </section>
  );
}
