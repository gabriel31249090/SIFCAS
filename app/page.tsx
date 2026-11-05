import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, CircleAlert, Clock3, Leaf, ListTodo, RefreshCw, Sparkles, Sun, Upload, Waves } from "lucide-react";
import { AeroIcon } from "@/components/AeroIcon";
import { SectionTitle } from "@/components/UI";
import { requireAccount, roleLabels } from "@/lib/auth";
import { getHomeAttention, listUserShortcuts, type AttentionItem } from "@/lib/experience";
import { getHomeToday } from "@/lib/home-today-server";
import { getTeacherWorkspace } from "@/lib/teacher-workspace";
import { getAccessibleModules, getDefaultFavoritePaths } from "@/lib/module-catalog";
import { formatNoticeDate } from "@/lib/public-notices";
import { getRequestTimestamp } from "@/lib/request-time";
import { safeInternalPath } from "@/lib/safe-path";
import type { TodayItem } from "@/lib/home-today";
import { StudentGreeting } from "@/components/StudentExperienceProvider";
import styles from "./home.module.css";

function shortDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
const eventIcons = { class: BookOpen, assessment: ListTodo, task: Clock3, event: CalendarDays, notice: Bell };
function sourceDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? shortDate(value) : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

function AgendaRows({ items, today }: { items: TodayItem[]; today: string }) {
  return <div className={styles.agendaList}>{items.map((item) => <Link href={item.href} className={styles.agendaRow} key={`${item.sourceId}:${item.id}`}>
    <div className={styles.agendaTime}><strong>{item.time ?? "Dia todo"}</strong><small>{item.date === today ? "hoje" : shortDate(item.date)}</small></div>
    <span className={styles.agendaLine} aria-hidden="true"/>
    <div className={styles.agendaContent}><strong>{item.title}</strong><small>{item.detail}</small><span className={styles.origin}><span/>{item.sourceLabel}{item.imported ? " · cópia" : ""}{item.time && !item.timeZone ? " · horário na origem" : ""}</span></div>
    <AeroIcon icon={eventIcons[item.kind]} size={15} tone={item.kind === "notice" ? "amber" : item.kind === "class" ? "leaf" : "sky"}/>
  </Link>)}</div>;
}

export default async function Home() {
  const account = await requireAccount();
  const teacher = ["teacher", "manager", "admin"].includes(account.role);
  const [today, attentionResult, shortcutResult, workspaceResult] = await Promise.all([
    getHomeToday(account), Promise.allSettled([getHomeAttention(account)]), Promise.allSettled([listUserShortcuts(account.id)]),
    teacher ? getTeacherWorkspace(account) : Promise.resolve(null),
  ]);
  const attention: AttentionItem[] = attentionResult[0].status === "fulfilled" ? attentionResult[0].value : [{ label: "Sua central de atenção", value: "—", detail: "Não foi possível consultar esta fonte. Abra a central para tentar novamente.", href: "/pendencias", kind: "warn" }];
  const shortcuts = shortcutResult[0].status === "fulfilled" ? shortcutResult[0].value : [];
  const unknownAttention = attention.some((entry) => entry.value === "—");
  const alerts = attention.filter((entry) => Number(entry.value) > 0);
  const modules = getAccessibleModules(account.role);
  const preferred = getDefaultFavoritePaths(account.role);
  const preferredLinks = preferred.flatMap((href) => modules.find((module) => module.href === href) ?? []);
  const quickLinks = [...preferredLinks, ...modules.filter((module) => !preferred.includes(module.href))];
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Cuiaba" }).format(new Date(getRequestTimestamp()));
  const upcoming = today.items.filter((item) => item.date !== today.today);
  const pendingDates = today.items.filter((item) => ["task", "assessment", "notice"].includes(item.kind));
  const cardCount = teacher && workspaceResult && !["unavailable", "forbidden"].includes(workspaceResult.status) ? String(workspaceResult.cards.length) : "—";

  return <div className={styles.home} data-experience-home="true">
    <div className={styles.heading} data-experience-fixed="heading"><div><span className={styles.eyebrow}><span/> SEU ESPAÇO NO CAMPUS</span><h1><StudentGreeting name={account.fullName.split(" ")[0]}/></h1><p>Um novo dia para aprender, criar e fazer acontecer.</p></div><div className={styles.date}><Sun size={20} aria-hidden="true"/><span>{date}<small>Campus Cáceres · America/Cuiaba</small></span></div></div>
    <section className={styles.hero} data-experience-fixed="hero" aria-labelledby="home-welcome">
      <div className={styles.heroContent}><span className={styles.heroLabel}><Leaf size={13} aria-hidden="true"/> CONECTE-SE AO QUE IMPORTA</span><h2 id="home-welcome">Seu campus.<br/>Um mundo de possibilidades.</h2><p>Sua agenda, suas turmas e novos caminhos.<br/>Tudo mais perto, para você ir mais longe.</p><div className={styles.heroActions}><Link className="button primary" href={teacher ? "/minhas-turmas" : "/agenda-aluno"}>{teacher ? <BookOpen size={16}/> : <CalendarDays size={16}/>}{teacher ? "Explorar minhas turmas" : "Explorar minha agenda"}<ArrowRight size={16}/></Link><Link href="/aplicativos">Todos os aplicativos <ArrowUpRight size={15}/></Link></div></div>
      <div className={styles.heroLandscape} aria-hidden="true"/><div className={styles.heroGlassNote}><AeroIcon icon={Waves} tone="leaf" size={16}/><span>Conhecimento que conecta.<small>Comunidade, natureza e possibilidades.</small></span></div>
    </section>
    <div className={styles.metrics} data-experience-widget="metrics">
      {[{ label: "Na sua agenda hoje", value: String(today.todayItems.length), detail: "Nas fontes disponíveis", icon: CalendarDays, tone: "sky" as const },
        { label: "Prazos nesta semana", value: String(pendingDates.length), detail: "Avaliações, tarefas e editais", icon: Clock3, tone: "amber" as const },
        { label: teacher ? "Minhas turmas" : "Seu vínculo", value: teacher ? cardCount : roleLabels[account.role], detail: teacher ? "Diários sob sua responsabilidade" : today.academic?.className ?? account.campus, icon: BookOpen, tone: "leaf" as const },
        { label: "Pontos de atenção", value: unknownAttention ? "—" : String(alerts.length), detail: unknownAttention ? "Uma fonte precisa ser consultada" : "Avisos e solicitações locais", icon: Bell, tone: "coral" as const }].map((metric) => <article className={styles.metric} key={metric.label}><AeroIcon icon={metric.icon} tone={metric.tone} size={20}/><div><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div></article>)}
    </div>
    <div data-experience-widget="quick-links"><SectionTitle title="Seus caminhos, a um clique" description="Um atalho para o que faz parte da sua rotina." href="/aplicativos" linkLabel="Ver todos"/>
    <div className={styles.quickLinks} data-experience-favorite-list>{quickLinks.map((module) => <Link href={module.href} data-experience-favorite={module.href} hidden={!preferred.includes(module.href)} key={module.href}><AeroIcon name={module.icon} size={23}/><strong>{module.label}</strong><ArrowUpRight size={14} aria-hidden="true"/></Link>)}</div></div>
    <div className={styles.mainGrid} data-experience-widget="agenda">
      <section className={styles.panel} aria-labelledby="today-heading"><div className={styles.panelHead}><div><span className={styles.kicker}>UM DIA DE CADA VEZ</span><h2 id="today-heading">O que acontece hoje <span>{today.todayItems.length}</span></h2></div><Link href="/agenda-aluno" aria-label="Abrir agenda completa"><CalendarDays size={19}/></Link></div>
        {today.todayItems.length ? <AgendaRows items={today.todayItems.slice(0, 5)} today={today.today}/> : <div className={styles.empty}><AeroIcon name="calendar" size={24}/><strong>Um espaço para se organizar.</strong><p>{today.emptyMessage}</p><Link href="/agenda-aluno">Abrir minha agenda <ArrowRight size={14}/></Link></div>}
        <div className={styles.sourceNote}><CircleAlert size={14} aria-hidden="true"/><span>SUAP e AVA direto ainda não conectados. Os itens acima mantêm sua origem identificada.</span></div><Link className={styles.panelFooter} href="/agenda-aluno">Ver agenda completa <ArrowRight size={15}/></Link>
      </section>
      <aside className={styles.rightColumn}><section className={styles.assistant}><div className={styles.assistantTop}><AeroIcon icon={Sparkles} tone="violet" size={26}/><span><i/> LUMA LOCAL</span></div><h2>Um pouco de ajuda.<br/>Um monte de possibilidades.</h2><p>Encontre um serviço, tire uma dúvida e descubra o próximo passo com a sua assistente.</p><Link href="/maisa">Vamos conversar <ArrowUpRight size={17}/></Link><div className={styles.assistantOrbits} aria-hidden="true"/></section><section className={styles.importInvite}><AeroIcon icon={Upload} size={20} tone="leaf"/><div><h3>Menos retrabalho. Mais tempo.</h3><p>{teacher ? "Aproveite dados de um diário existente com uma cópia revisada." : "Traga os eventos do seu AVA para a sua agenda privada."}</p><Link href={teacher ? "/importar-dados-academicos" : "/importar-calendario"}>{teacher ? "Importar um diário" : "Importar calendário"}<ArrowRight size={14}/></Link></div></section></aside>
    </div>
    <div className={styles.secondaryGrid} data-experience-fixed="secondary"><section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.kicker}>OLHE PARA A FRENTE</span><h2>Vem por aí</h2></div><Link href="/agenda-aluno">Próximos 7 dias <ArrowUpRight size={14}/></Link></div>{upcoming.length ? <AgendaRows items={upcoming.slice(0, 4)} today={today.today}/> : <p className={styles.quiet}>Não há itens futuros disponíveis nestas fontes. Consulte também a agenda do campus.</p>}</section><section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.kicker}>NOVOS CAMINHOS</span><h2>Oportunidades para você</h2></div><AeroIcon name="compass" size={17} tone="leaf"/></div>{today.notices.length ? <div className={styles.notices}>{today.notices.slice(0, 2).map((notice) => <Link href={`/editais?q=${encodeURIComponent(`${notice.number}/${notice.year}`)}`} key={notice.id}><span>{notice.category} · {notice.number}/{notice.year}</span><strong>{notice.title}</strong><small>Prazo informado: {formatNoticeDate(notice.closes)}</small><ArrowUpRight size={16}/></Link>)}</div> : <p className={styles.quiet}>Consulte a central de editais para ver o catálogo, retificações e informações a confirmar.</p>}<Link href="/editais" className={styles.panelFooter}>Explorar editais <ArrowRight size={15}/></Link></section></div>
    <section className={styles.attention} data-experience-widget="attention"><div><AeroIcon icon={ListTodo} size={21} tone="amber"/><div><h2>Sua atenção faz a diferença</h2><p>Acompanhe o que pede um próximo passo.</p></div></div><div className={styles.attentionItems}>{attention.slice(0, 3).map((entry) => <Link href={entry.href} key={entry.label}><span><strong>{entry.label}</strong><small>{entry.detail}</small></span><b>{entry.value}</b></Link>)}</div></section>
    <section className={styles.sources} data-experience-widget="sources" aria-label="Estado das fontes"><div className={styles.sourcesHeading}><RefreshCw size={16}/><span>Transparência que aproxima.</span><small>Cada informação tem sua origem.</small></div><div className={styles.sourceChips}>{today.sources.map((source) => <Link href={source.href} title={source.detail} data-state={source.status} key={source.id}><i/>{source.label}<span>{source.status === "ready" ? "disponível" : source.status === "imported" ? "cópia por arquivo" : source.status === "unavailable" ? "indisponível" : "a configurar"}</span>{source.updatedAt && <time dateTime={source.updatedAt} title="Última atualização ou revisão">· {sourceDate(source.updatedAt)}</time>}</Link>)}</div><p>Cópias por arquivo dependem de nova importação. Uma fonte desconectada ou indisponível pode ter compromissos que ainda não aparecem aqui.</p></section>
    {shortcuts.length > 0 && <div className={styles.favorites} data-experience-fixed="favorites"><span>Do seu jeito</span>{shortcuts.slice(0, 5).map((shortcut) => <Link href={safeInternalPath(shortcut.href, "/aplicativos")} key={shortcut.id}>{shortcut.label}<ArrowUpRight size={13}/></Link>)}<Link href="/atalhos">Personalizar</Link></div>}
    <p className={styles.evolution} data-experience-fixed="evolution">Um portal feito para evoluir com a comunidade. <Link href="/portal-evolucao">Conheça as próximas prioridades <ArrowUpRight size={13}/></Link></p>
  </div>;
}
