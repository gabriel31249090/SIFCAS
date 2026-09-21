"use client";
import Link from "next/link";
import { TriangleAlert, RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="card centerState" role="alert"><span className="stateIcon"><TriangleAlert size={28} /></span><h1>Não foi possível carregar esta página.</h1><p>A conexão pode ter sido interrompida. Tente novamente; nenhuma informação foi alterada por esta tentativa de carregar a página.</p><div className="stateActions"><button type="button" className="button primary" onClick={reset}><RefreshCw size={18} />Tentar novamente</button><Link className="button soft" href="/aplicativos">Ver aplicativos</Link></div></section>;
}
