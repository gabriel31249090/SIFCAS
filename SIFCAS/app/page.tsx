import Link from "next/link";
import { Activity, CalendarDays, ClipboardCheck, FileText, GraduationCap, Pin, BookOpen, School, Clock3 } from "lucide-react";
import { SectionTitle, StatCard } from "@/components/UI";

export default function Home() {
  return <>
    <section className="hero">
      <div><span className="eyebrow">Portal integrado IFMT</span><h1>Um único lugar para estudar, acompanhar e resolver.</h1><p>O SIFCAS reúne vida acadêmica, serviços, informações do Campus Cáceres e rotinas administrativas em uma experiência única.</p><div className="heroActions"><Link className="button primary" href="/estudante">Abrir área do estudante</Link><Link className="button glass" href="/servicos">Explorar serviços</Link></div></div>
      <aside className="todayPanel"><small>Hoje</small><strong>17 SET</strong><hr/><small>Próxima atividade</small><b>Matemática • 13:30</b><span>Sala B-12 • Campus Cáceres</span></aside>
    </section>

    <div className="statGrid">
      <StatCard label="Frequência geral" value="92%" foot="Situação regular" icon={Activity}/>
      <StatCard label="Pendências" value="3" foot="2 acadêmicas" icon={ClipboardCheck}/>
      <StatCard label="Documentos" value="12" foot="2 recentes" icon={FileText}/>
      <StatCard label="Editais abertos" value="8" foot="Oportunidades" icon={Pin}/>
    </div>

    <SectionTitle title="Acesso rápido" description="As ações mais usadas ficam sempre a um clique."/>
    <div className="quickGrid">
      <Link href="/estudante"><GraduationCap/>Boletim e notas</Link>
      <Link href="/agenda-aluno"><CalendarDays/>Minha agenda</Link>
      <Link href="/documentos"><FileText/>Solicitar documento</Link>
      <Link href="/editais"><Pin/>Editais e bolsas</Link>
      <Link href="/ensino"><BookOpen/>Ensino</Link>
      <Link href="/campus"><School/>Meu campus</Link>
      <Link href="/agenda-institucional"><CalendarDays/>Agenda institucional</Link>
      <Link href="/noticias"><Clock3/>Eventos e notícias</Link>
    </div>

    <div className="twoCols dashboardLower">
      <section className="card panel"><SectionTitle title="Minha semana" description="Aulas, prazos e compromissos importantes." href="/agenda-aluno" linkLabel="Agenda completa"/>
        <div className="timeline">
          {[['08:00','Programação II','Laboratório 03 • Hoje'],['13:30','Matemática','Sala B-12 • Hoje'],['23:59','Prazo: atividade de Inglês','Entrega online • Amanhã'],['SEX','Projeto de extensão','Último dia para inscrição']].map(([t,a,b])=><div className="timelineRow" key={a}><time>{t}</time><span className="timelineDot"/><div><strong>{a}</strong><small>{b}</small></div></div>)}
        </div>
      </section>
      <section className="card panel"><SectionTitle title="Pendências" description="Itens que precisam da sua atenção."/>
        <div className="stackList"><div><b>Atualizar dados cadastrais</b><span>Ação necessária</span></div><div><b>Documento aguardando ciência</b><span>Novo</span></div><div><b>Confirmar participação em evento</b><span>3 dias</span></div></div>
      </section>
    </div>
  </>;
}
