"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { activateTeacherDemo, type TeacherDemoStatus } from "./demo-actions";

export default function TeacherDemoControl({ autoActivate }: { autoActivate: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<TeacherDemoStatus | null>(null);
  const began = useRef(false);
  const running = useRef(false);

  const activate = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      let lastDone = -1;
      for (let pass = 0; pass < 12; pass++) {
        const result = await activateTeacherDemo();
        setStatus(result);
        if (result.state === "ready") {
          router.refresh();
          break;
        }
        if (result.state === "error") break;
        if (result.done <= lastDone) {
          setStatus({
            state: "error",
            message: "A criação dos usuários não avançou. Confira os logs do Supabase Auth.",
          });
          break;
        }
        lastDone = result.done;
      }
    } catch {
      setStatus({
        state: "error",
        message: "Erro na ativação. Confira sua sessão e as configurações do Supabase.",
      });
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (autoActivate && !began.current) {
      began.current = true;
      void activate();
    }
  }, [autoActivate, activate]);

  return <section className="card panel" aria-label="Dados fictícios da conta Professor Teste" style={{ marginBottom: 18 }}>
    <div className="sectionTitle" style={{ marginTop: 0 }}>
      <div>
        <h2>Ambiente de demonstração do Professor Teste</h2>
        <p>Ativação automática por padrão. Apenas a conta fictícia pode usar este controle; os dados reais permanecem separados.</p>
      </div>
      <span className="badge">{busy ? "Ativando" : status?.state === "error" ? "Falha" : autoActivate && status?.state !== "ready" ? "Preparando" : "Ligado"}</span>
    </div>
    <p>50 alunos, 11 professores, 8 servidores, diários, avaliações, frequências, calendário e atividades simuladas.</p>
    <button type="button" className="button soft" onClick={() => void activate()} disabled={busy}>
      {busy ? "Preenchendo dados fictícios..." : "Ativar / reativar os dados fictícios"}
    </button>
    {status?.state === "progress" && <p role="status">{status.done} de {status.total} contas ativadas. Restantes: {status.remaining}.</p>}
    {status?.state === "error" && <div className="infoBox errorBox" role="alert">{status.message}</div>}
    {status?.state === "ready" && <div className="infoBox successBox" role="status">
      Demonstração ativa: {status.academic.sessions ?? 0} aulas, {status.academic.assessments ?? 0} avaliações,
      {" "}{status.academic.grades ?? 0} notas, {status.academic.attendance ?? 0} frequências
      e {status.calendar.calendar_events ?? 0} eventos simulados no calendário.
    </div>}
  </section>;
}
