import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/UI";
import { MaisaChat } from "@/components/MaisaChat";
import { requireAccount, roleLabels } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MaisaPage() {
  const account = await requireAccount();
  const firstName = account.fullName.split(/\s+/).filter(Boolean)[0] || "usuário";

  return (
    <>
      <PageHeader
        title="MAISA"
        description="Módulo de Assistência Inteligente em Serviços Acadêmicos e Administrativos, integrado ao SIFCAS por uma API segura."
        action={<span className="badge"><Sparkles size={13}/> Dify + SIFCAS</span>}
      />

      <section className="maisaHero card">
        <div className="maisaHeroIcon"><Bot size={30}/></div>
        <div>
          <span className="eyebrow">Assistente institucional</span>
          <h2>Olá, {firstName}. A MAISA está online.</h2>
          <p>Converse com a assistente sem expor a chave da API no navegador. Cada conversa é isolada pelo seu usuário autenticado no SIFCAS.</p>
        </div>
        <span className="maisaRole"><ShieldCheck size={15}/>{roleLabels[account.role]}</span>
      </section>

      <MaisaChat firstName={firstName} roleLabel={roleLabels[account.role]}/>
    </>
  );
}
