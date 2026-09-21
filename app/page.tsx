import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCheck, GraduationCap, ListTodo, BookmarkPlus, Sparkles, Layers3, UserRound, CircleAlert } from "lucide-react";
import { SectionTitle, StatCard } from "@/components/UI";
import { ModuleIcon } from "@/components/ModuleIcon";
import { requireAccount, roleLabels } from "@/lib/auth";
import { getAcademicOverview, getAgendaContext, getStudentAcademicContext } from "@/lib/academic";
import { getHomeAttention, listUserShortcuts } from "@/lib/experience";
import { getAccessibleModules } from "@/lib/module-catalog";
import { safeInternalPath } from "@/lib/safe-path";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Cuiaba" }).format(new Date(iso + "T12:00:00-04:00"));
}

export default async function Home() {
  const account = await requireAccount();
  const canManage = ["manager", "admin"].includes(account.role);
  const [overview, agenda, academic, attention, shortcuts] = await Promise.all([
    canManage ? getAcademicOverview() : Promise.resolve(null),
    getAgendaContext(account),
    account.role === "student" ? getStudentAcademicContext(account.id) : Promise.resolve(null),
    getHomeAttention(account),
    listUserShortcuts(account.id),
  ]);
  const modules = getAccessibleModules(account.role);
  const preferred = account.role === "student"
    ? ["/boletim", "/agenda-aluno", "/documentos-academicos", "/solicitacoes", "/oportunidades", "/editais"]
    : account.role === "teacher"
      ? ["/diario-professor", "/agenda-aluno", "/solicitacoes", "/documentos", "/projetos", "/editais"]
      : canManage
        ? ["/gestao-academica", "/painel-institucional", "/usuarios", "/vinculos-institucionais", "/monitoramento", "/solicitacoes"]
        : ["/painel-institucional", "/solicitacoes", "/pessoas", "/documentos", "/processos", "/agenda-institucional"];
  const quickLinks = preferred.flatMap((href) => modules.find((item) => item.href === href) ?? []);
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Cuiaba" }).format(new Date());
  const nextEntry = agenda.entries[0];

  return <>
    <div className="dashboardHeading"><div><span className="sectionEyebrow">{account.campus}</span><h1>Olá, {account.fullName.split(" ")[0]}<span className="greetingDot">.</span></h1><p>Vamos cuidar da sua rotina no campus?</p></div><div className="dashboardDate"><CalendarDays size={19} /><span>{date}</span></div></div>
    <div className="dashboardLead">
      <section className="workspaceWelcome"><div><span className="welcomeKicker">SEU PRÓXIMO PASSO</span><h2>Tudo em dia começa<br />por aqui.</h2><p>Confira seus prazos, acompanhe solicitações e encontre os serviços de que precisa.</p><Link className="button light" href="/pendencias">Ver minhas pendências<ArrowRight size={18} /></Link></div><div className="welcomeEmblem" aria-hidden="true"><CheckCheck size={72} strokeWidth={1.25} /></div></section>
      <section className="card nextAppointment"><div className="appointmentTitle"><span className="iconBox"><CalendarDays size={22} /></span><span>Na sua agenda</span></div>{nextEntry ? <><span className="appointmentDate">{formatDate(nextEntry.entryDate)}</span><h2>{nextEntry.title}</h2><p>{nextEntry.subjectName}{nextEntry.startsAt ? " · " + nextEntry.startsAt.slice(0, 5) : ""}</p><small>{nextEntry.className}</small></> : <><span className="appointmentDate quiet">Um espaço para planejar.</span><h2>Sem atividades publicadas</h2><p>Quando houver um novo compromisso vinculado a você, ele aparecerá aqui.</p></>}<Link href={account.role === "staff" ? "/agenda-institucional" : "/agenda-aluno"}>Abrir agenda<ArrowUpRight size={17} /></Link></section>
    </div>
    <div className="statGrid dashboardStats">
      <StatCard label="Seu vínculo" value={roleLabels[account.role]} foot={account.campus} icon={UserRound} />
      {account.role === "student" ? <StatCard label="Minha turma" value={academic?.className ?? "Não vinculada"} foot={academic?.courseName ?? "Aguardando vínculo acadêmico"} icon={GraduationCap} /> : <StatCard label="Meus atalhos" value={String(shortcuts.length)} foot="Acessos personalizados" icon={BookmarkPlus} />}
      <StatCard label="Agenda acadêmica" value={String(agenda.entries.length)} foot="Atividades nos próximos 35 dias" icon={CalendarDays} />
      {overview ? <StatCard label="Turmas ativas" value={String(overview.classCount)} foot={overview.courseCount + " cursos cadastrados"} icon={Layers3} /> : <StatCard label="Pontos de atenção" value={String(attention.filter((item) => Number(item.value) > 0 || item.kind !== "info").length)} foot="Confira os detalhes abaixo" icon={ListTodo} />}
    </div>
    <SectionTitle title="Direto ao que importa" description="Acessos selecionados para o seu vínculo." href="/aplicativos" linkLabel="Todos os aplicativos" />
    <div className="dashboardQuick">{quickLinks.map((item) => <Link href={item.href} key={item.href}><span className="moduleIconTile"><ModuleIcon name={item.icon} /></span><strong>{item.label}</strong><ArrowUpRight size={16} className="quickArrow" /></Link>)}</div>
    <div className="twoCols dashboardLower">
      <section className="card panel"><SectionTitle title="Sua atenção faz a diferença" description="Pendências e avisos para acompanhar." href="/pendencias" linkLabel="Ver detalhes" /><div className="attentionList">{attention.map((item) => <Link href={item.href} className={"attentionItem " + item.kind} key={item.label}><span className="iconBox">{item.kind === "info" ? <CheckCheck size={21} /> : <CircleAlert size={21} />}</span><span><b>{item.label}</b><small>{item.detail}</small></span><strong>{item.value}</strong></Link>)}</div></section>
      <section className="maisaInvite"><span className="maisaInviteIcon"><Sparkles size={28} /></span><span className="sectionEyebrow">CONHEÇA A MAISA</span><h2>Precisa encontrar<br />um caminho?</h2><p>Consulte orientações e informações disponíveis para o seu perfil com a assistente local.</p><Link href="/maisa">Conversar com a MAISA<ArrowRight size={18} /></Link></section>
    </div>
    <div className="twoCols dashboardLower">
      <section className="card panel"><SectionTitle title="Próximos compromissos" description="Atividades associadas ao seu vínculo." href={account.role === "staff" ? "/agenda-institucional" : "/agenda-aluno"} linkLabel="Agenda completa" />{agenda.entries.length ? <div className="timeline">{agenda.entries.slice(0, 5).map((entry) => <div className="timelineRow" key={entry.id}><time>{formatDate(entry.entryDate)}</time><span className="timelineDot" /><div><strong>{entry.title}</strong><small>{entry.subjectName} · {entry.className}{entry.startsAt ? " · " + entry.startsAt.slice(0, 5) : ""}</small></div></div>)}</div> : <div className="quietEmpty"><CalendarDays size={28} /><p>Sem atividades futuras publicadas.</p><small>Confira também a agenda institucional do campus.</small></div>}</section>
      <section className="card panel"><SectionTitle title="Do seu jeito" description="Seus acessos favoritos, sempre por perto." href="/atalhos" linkLabel="Personalizar" />{shortcuts.length ? <div className="personalShortcutGrid">{shortcuts.slice(0, 8).map((item) => <Link href={safeInternalPath(item.href, "/aplicativos")} key={item.id}><BookmarkPlus size={18} />{item.label}</Link>)}</div> : <div className="quietEmpty"><BookmarkPlus size={28} /><p>Quais caminhos você usa mais?</p><Link className="button soft" href="/atalhos">Adicionar meus atalhos</Link></div>}</section>
    </div>
  </>;
}
