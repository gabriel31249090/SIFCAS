"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pt-BR"><body style={{ margin: 0, background: "#f3f6f8", color: "#182c28", fontFamily: "system-ui, sans-serif", padding: "10vh 24px" }}><main style={{ maxWidth: 520, margin: "auto" }}><p>SIFCAS</p><h1>Vamos tentar de novo?</h1><p>Não conseguimos carregar o portal agora. Aguarde um instante e tente novamente.</p><button type="button" onClick={reset} style={{ padding: "14px 22px", background: "#0c7557", color: "#fff", border: 0, borderRadius: 12, cursor: "pointer", fontSize: 16 }}>Recarregar</button></main></body></html>;
}
