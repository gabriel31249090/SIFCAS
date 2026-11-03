import Link from "next/link";
import { ArrowRight, Compass, LayoutDashboard, ShieldCheck, Sparkles, Smartphone, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/UI";

const roadmap = [
  {
    title: "Navegação inteligente",
    description: "Reduzir cliques e mostrar os módulos mais relevantes para cada perfil em vez de espalhar funcionalidades em telas desconexas.",
    icon: Compass,
  },
  {
    title: "Dashboard centralizado",
    description: "Unificar agenda, pendências, alertas e próximos passos em uma visão de alto valor para o usuário do dia a dia.",
    icon: LayoutDashboard,
  },
  {
    title: "Experiência mobile",
    description: "Aumentar clareza, rapidez e conforto no celular, com ações principais em um toque e layouts mais leves.",
    icon: Smartphone,
  },
  {
    title: "Personalização por perfil",
    description: "Aluno, professor, coordenação e gestão precisam ver o que importa para o seu papel, sem ruído visual ou excesso de informação.",
    icon: Users,
  },
  {
    title: "Busca e organização",
    description: "Melhorar a localização de serviços, documentos e informações por categoria, contexto e intenção de busca.",
    icon: Target,
  },
  {
    title: "IA contextual",
    description: "Com a LUMA, orientar o usuário em ações, pendências e próximos passos sem atrapalhar a rotina da plataforma.",
    icon: Sparkles,
  },
  {
    title: "Confiança e clareza",
    description: "Textos mais diretos, feedbacks de ação e sinais de segurança para aumentar a percepção de confiabilidade do sistema.",
    icon: ShieldCheck,
  },
];

const phases = [
  {
    label: "Fase 1",
    title: "Experiência do usuário",
    body: "Dashboard, navegação mais direta, pendências reunidas e melhor linguagem para ações fundamentais.",
  },
  {
    label: "Fase 2",
    title: "Personalização",
    body: "Atalhos por perfil, módulos priorizados e fluxo adaptado ao papel do usuário no SIFCAS.",
  },
  {
    label: "Fase 3",
    title: "IA e automação",
    body: "Sugestões inteligentes, alertas proativos e apoio contextual em decisões do dia a dia.",
  },
  {
    label: "Fase 4",
    title: "Otimização contínua",
    body: "Métricas, testes de UX e refinamento com base em uso real para evoluir sem perder a clareza.",
  },
];

export default function PortalEvolutionPage() {
  return <>
    <PageHeader
      title="Portal em evolução"
      description="A estratégia de melhoria do SIFCAS foca em clareza, valor para o usuário e experiências mais inteligentes em cada tela."
      action={<Link href="/" className="button soft">Voltar para o início</Link>}
    />

    <section className="portalOverview card">
      <div>
        <span className="sectionEyebrow">OBJETIVO</span>
        <h2>Transformar o portal em uma experiência mais funcional, confiável e moderna.</h2>
      </div>
      <p>O próximo passo do produto não é apenas ampliar módulos, mas tornar cada ação mais intuitiva, mais rápida e melhor compreendida no contexto do usuário.</p>
    </section>

    <section className="portalRoadmapGrid">
      {roadmap.map(({ title, description, icon: Icon }) => (
        <article className="portalRoadmapCard card" key={title}>
          <span className="portalRoadmapIcon"><Icon size={20} /></span>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>
      ))}
    </section>

    <section className="card portalPhaseSection">
      <div className="sectionTitle">
        <div>
          <span className="sectionEyebrow">ROADMAP</span>
          <h2>Fases de evolução</h2>
        </div>
      </div>
      <div className="portalPhaseGrid">
        {phases.map((phase) => (
          <article className="portalPhaseCard" key={phase.label}>
            <span className="portalPhaseLabel">{phase.label}</span>
            <h3>{phase.title}</h3>
            <p>{phase.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="portalResult card">
      <span className="sectionEyebrow">RESULTADO ESPERADO</span>
      <h2>Um portal que pareça inteligente, claro e útil no cotidiano.</h2>
      <p>Quando o usuário consegue agir rápido, entender o que acontece e confiar no sistema, o produto deixa de ser apenas funcional e passa a ser uma ferramenta de rotina com alto valor percebido.</p>
      <Link href="/maisa" className="button primary">Ir para a LUMA<ArrowRight size={18} /></Link>
    </section>
  </>;
}
