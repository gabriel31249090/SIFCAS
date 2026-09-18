import Link from "next/link";
import { AlertTriangle, Bot, CalendarDays, FileText, GraduationCap, Pin, BookOpen, School, Clock3, UserRound, Layers3, ListChecks, Link2 } from "lucide-react";
import { SectionTitle, StatCard } from "@/components/UI";
import { requireAccount, roleLabels } from "@/lib/auth";
import { getAcademicOverview, getAgendaContext, getStudentAcademicContext } from "@/lib/academic";
import { getHomeAttention, listUserShortcuts } from "@/lib/experience";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Cuiaba" }).format(new Date(iso + "T12:00:00-04:00"));
}

export default async function Home() {
  const account = await requireAccount();
  const [overview, agenda, studentAcademic, attention, shortcuts] = await Promise.all([
    getAcademicOverview(),
    getAgendaContext(account),
    account.role === "student" ? getStudentAcademicContext(account.id) : Promise.resolve(null),
    getHomeAttention(account),
    listUserShortcuts(account.id),
  ]);
  const nextEntry = agenda.entries[0] ?? null;

  return <>
    <section className="hero">
      <div>
        <span className="eyebrow">Portal integrado IFMT</span>
        <h1>Olá, {account.fullName.split(" ")[0]}.</h1>
        <p>O SIFCAS reúne sua vida institucional e agora conta com MAISA, atalhos pessoais, alertas e autoatendimento em uma única interface.</p>
        <div className="heroActions"><Link className="button primary" href="/maisa"><Bot size={16}/>Falar com a MAISA</Link><Link className="button glass" href="/aplicativos">Abrir aplicativos</Link></div>
      </div>
      <aside className="todayPanel">
        <small>Próxima publicação</small>
        {nextEntry ? <>
          <strong>{formatDate(nextEntry.entryDate).toUpperCase()}</strong>
          <hr/>
          <small>{nextEntry.className}</small>
          <b>{nextEntry.subjectName}{nextEntry.startsAt ? " • " + nextEntry.startsAt.slice(0, 5) : ""}</b>
          <span>{nextEntry.title}</span>
        </> : <>
          <strong>SEM ITENS</strong>
          <hr/>
          <small>Agenda acadêmica</small>
          <b>Nenhuma atividade futura publicada</b>
          <span>Novos itens aparecerão automaticamente.</span>
        </>}
      </aside>
    </section>

    <div className="statGrid">
      <StatCard label="Meu perfil" value={roleLabels[account.role]} foot={account.campus} icon={UserRound}/>
      <StatCard label="Matrícula ativa" value={studentAcademic ? "1" : "0"} foot={studentAcademic?.className ?? "Sem turma vinculada"} icon={GraduationCap}/>
      <StatCard label="Agenda futura" value={String(agenda.entries.length)} foot="Próximos 35 dias" icon={ListChecks}/>
      <StatCard label="Estrutura acadêmica" value={String(overview.classCount)} foot={overview.courseCount + " cursos • " + overview.subjectCount + " disciplinas"} icon={Layers3}/>
    </div>

    <SectionTitle title="Acesso rápido" description="Os caminhos principais do SIFCAS."/>
    <div className="quickGrid">
      <Link href="/maisa"><Bot/>Falar com a MAISA</Link>
      <Link href="/estudante"><GraduationCap/>Minha vida acadêmica</Link>
      <Link href="/agenda-aluno"><CalendarDays/>Minha agenda</Link>
      <Link href="/documentos"><FileText/>Documentos</Link>
      <Link href="/editais"><Pin/>Editais e bolsas</Link>
      <Link href="/ensino"><BookOpen/>Ensino</Link>
      <Link href="/campus"><School/>Meu campus</Link>
      <Link href="/agenda-institucional"><CalendarDays/>Agenda institucional</Link>
      <Link href="/noticias"><Clock3/>Eventos e notícias</Link>
    </div>

    <div className="twoCols dashboardLower">
      <section className="card panel">
        <SectionTitle title="Fique atento" description="Pendências e pontos que podem exigir sua ação."/>
        <div className="attentionList">
          {attention.map((item) => <Link href={item.href} className={"attentionItem " + item.kind} key={item.label}>
            <span className="iconBox"><AlertTriangle size={17}/></span>
            <span><b>{item.label}</b><small>{item.detail}</small></span>
            <strong>{item.value}</strong>
          </Link>)}
        </div>
      </section>

      <section className="card panel">
        <SectionTitle title="Meus atalhos" description="Acessos pessoais inspirados no recurso de atalhos do SUAP." href="/atalhos" linkLabel="Gerenciar"/>
        {shortcuts.length === 0 ? <div className="infoBox">Você ainda não configurou atalhos. Abra “Gerenciar” para montar seu acesso rápido.</div> : <div className="personalShortcutGrid">
          {shortcuts.slice(0,8).map((item) => <Link href={item.href} key={item.id}><Link2 size={15}/>{item.label}</Link>)}
        </div>}
      </section>
    </div>

    <div className="twoCols dashboardLower">
      <section className="card panel">
        <SectionTitle title="Minha agenda" description="Próximas publicações associadas ao seu vínculo." href="/agenda-aluno" linkLabel="Agenda completa"/>
        {agenda.entries.length === 0 ? <div className="infoBox">Nenhuma atividade futura disponível.</div> : <div className="timeline">
          {agenda.entries.slice(0, 5).map((entry) => <div className="timelineRow" key={entry.id}>
            <time>{entry.startsAt?.slice(0, 5) ?? formatDate(entry.entryDate)}</time><span className="timelineDot"/><div><strong>{entry.subjectName} • {entry.title}</strong><small>{entry.className} • {formatDate(entry.entryDate)}</small></div>
          </div>)}
        </div>}
      </section>
      <section className="card panel">
        <SectionTitle title="Núcleo acadêmico" description="Status da base estrutural."/>
        <div className="stackList">
          <div><b>{overview.campusCount} campus ativo</b><span>Estrutura institucional</span></div>
          <div><b>{overview.courseCount} cursos cadastrados</b><span>Catálogo acadêmico</span></div>
          <div><b>{overview.classCount} turmas ativas</b><span>{overview.enrollmentCount} matrículas ativas</span></div>
        </div>
      </section>
    </div>
  </>;
}
