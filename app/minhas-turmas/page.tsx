import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BookOpenCheck, CalendarDays, ClipboardList, FileUp, Filter, GraduationCap, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { AeroIcon } from "@/components/AeroIcon";
import { requireAccount } from "@/lib/auth";
import { getTeacherWorkspace } from "@/lib/teacher-workspace";
import { filterTeacherClasses } from "@/lib/teacher-workspace-domain";
import styles from "./minhas-turmas.module.css";

type Params = Promise<{ q?: string; periodo?: string }>;
const countLabel = (value: number | null) => value === null ? "—" : String(value);
function importedAt(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value)) : "Ainda sem importação";
}

export default async function TeacherWorkspacePage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const period = typeof params.periodo === "string" ? params.periodo.trim().slice(0, 160) : "";
  const workspace = await getTeacherWorkspace(account);
  const cards = filterTeacherClasses(workspace.cards, query, period);
  const periods = [...new Set(workspace.cards.flatMap((card) => card.periods))].sort((a, b) => b.localeCompare(a, "pt-BR"));
  const copyCount = cards.reduce((sum, card) => sum + card.copies.length, 0);
  const unreported = cards.reduce((sum, card) => sum + card.copies.reduce((total, copy) => total + copy.unreportedGrades, 0), 0);
  const visibleDiaryIds = new Set(cards.flatMap((card) => card.copies.map((copy) => copy.id)));
  const conflicts = workspace.conflicts.filter((batch) => visibleDiaryIds.has(batch.diary_id));

  return <>
    <PageHeader title="Minhas turmas" description="Abra seus diários, confira as cópias importadas e veja o que precisa de revisão em cada turma." action={<Link href="/importar-dados-academicos" className="button primary"><FileUp size={18} aria-hidden="true"/> Importar um diário</Link>}/>
    {workspace.status === "unavailable" && <div className="infoBox errorBox" role="status">Não foi possível verificar suas turmas. A fonte ou a configuração do ambiente está indisponível; este estado não significa ausência de pendências.</div>}
    {workspace.status === "partial" && <div className="infoBox" role="status">Parte das fontes está indisponível. Consulte os registros disponíveis abaixo e confirme os demais dados no sistema de origem.</div>}
    {account.role !== "teacher" && <div className="infoBox">Esta visão usa somente turmas liberadas por escopo explícito de importação. Os demais registros de gestão continuam na Gestão Acadêmica, sujeitos às permissões do ambiente.</div>}

    <section className={`card panel ${styles.filters}`} aria-label="Filtrar minhas turmas">
      <form action="/minhas-turmas" method="get" className="formStack"><label><span className="formFieldLabel"><Search size={16} aria-hidden="true"/>Buscar turma ou disciplina</span><input name="q" type="search" defaultValue={query} maxLength={100} placeholder="Ex.: Informática, matemática…"/></label><label><span className="formFieldLabel"><CalendarDays size={16} aria-hidden="true"/>Período</span><select name="periodo" defaultValue={period}><option value="">Todos os períodos disponíveis</option>{periods.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button soft" type="submit"><Filter size={17} aria-hidden="true"/> Filtrar</button>{query || period ? <Link href="/minhas-turmas">Limpar</Link> : null}</form>
    </section>

    <div className="statGrid">
      <StatCard label="Turmas e disciplinas" value={workspace.status === "unavailable" ? "—" : String(cards.length)} foot="Vínculos autorizados neste filtro" icon={GraduationCap}/>
      <StatCard label="Cópias de diários" value={workspace.importStatus === "ready" ? String(copyCount) : "—"} foot="Arquivos já importados" icon={BookOpenCheck}/>
      <StatCard label="Notas não informadas" value={workspace.importStatus === "ready" ? String(unreported) : "—"} foot="Estado explícito na cópia importada" icon={ClipboardList}/>
      <StatCard label="Lotes com conflito" value={workspace.historyStatus === "ready" ? String(conflicts.length) : "—"} foot="Suas prévias válidas para revisão" icon={TriangleAlert}/>
    </div>

    <SectionTitle title="Seu espaço de ensino" description="Lançamentos locais e cópias da origem aparecem separados. Nenhum valor é inferido quando faltam dados."/>
    {workspace.status === "empty" ? <div className="emptyState card"><GraduationCap size={32} aria-hidden="true"/><h2>Nenhuma turma autorizada disponível</h2><p>O SIFCAS ainda não encontrou um vínculo docente autorizado para sua conta. As turmas e o diário do SUAP não são sincronizados automaticamente; peça à gestão para conferir seu vínculo e, quando a integração estiver homologada, o mapeamento do diário.</p><div className={styles.actions}><Link className="button soft" href="/importar-dados-academicos">Ver estado da importação</Link><Link href="/diario-professor">Abrir diário do SIFCAS</Link></div></div>
      : workspace.cards.length > 0 && cards.length === 0 ? <div className="emptyState card"><Filter size={30} aria-hidden="true"/><h2>Nenhuma turma para estes filtros</h2><p>Procure outro termo ou período.</p><Link href="/minhas-turmas">Ver todas as minhas turmas</Link></div>
        : <div className={styles.grid}>{cards.map((card) => <article className={`card ${styles.classCard}`} key={card.id}>
          <header className={styles.classHeader}><AeroIcon name="book" tone="sky" size={22}/><div><span className={styles.code}>{card.code || "Vínculo autorizado"}</span><h2>{card.className}</h2><p>{card.subjectName}</p></div></header>
          <div className={styles.periods}>{card.periods.length ? card.periods.map((item) => <span className="badge" key={item}><CalendarDays size={13} aria-hidden="true"/> {item}</span>) : <span className="badge">Período a confirmar</span>}</div>
          <section className={styles.local} aria-label={`Registros locais de ${card.className}`}><h3>Planejamento local · SIFCAS</h3><dl><div><dt>Matrículas ativas</dt><dd>{countLabel(card.local.enrollments)}</dd></div><div><dt>Aulas</dt><dd>{countLabel(card.local.sessions)}</dd></div><div><dt>Avaliações</dt><dd>{countLabel(card.local.assessments)}</dd></div></dl>{card.local.status !== "ready" && <p className={styles.note}>Contagens locais incompletas ou de outro período. “—” indica que a informação não pôde ser confirmada.</p>}</section>
          {card.copies.map((copy) => <section className={styles.copy} aria-label={`Cópia importada ${copy.label}`} key={copy.id}>
            <div className={styles.copyTitle}><RefreshCw size={15} aria-hidden="true"/><h3>Cópia de leitura · {copy.period}</h3></div><p className={styles.note}>Origem: {copy.instance === "sifcas-layout" ? "Arquivo SIFCAS, layout convertido" : copy.instance}<br/>Última importação: {importedAt(copy.updatedAt)}{copy.updatedAt ? " · Cuiabá" : ""}</p>
            <dl><div><dt>Matrículas</dt><dd>{copy.enrollments}</dd></div><div><dt>Aulas</dt><dd>{copy.sessions}</dd></div><div><dt>Avaliações</dt><dd>{copy.assessments}</dd></div></dl>
            <ul className={styles.gradeStates}><li><span>Não informadas</span><b>{copy.unreportedGrades}</b></li><li><span>Ausentes</span><b>{copy.missingGrades}</b></li><li><span>Dispensadas</span><b>{copy.exemptGrades}</b></li><li><span>Notas lançadas</span><b>{copy.gradedGrades}</b></li></ul>
            {copy.zeroGrades > 0 && <p className={styles.note}>{copy.zeroGrades} nota(s) zero incluída(s) entre as notas lançadas. Ausência e campo não informado não equivalem a zero.</p>}
            {copy.activities.slice(0, 2).map((activity) => <a href={activity.url} target="_blank" rel="noopener noreferrer" className={styles.activity} key={activity.url}>{activity.title}<ArrowUpRight size={15} aria-hidden="true"/></a>)}
            <p className={styles.note}>A atualização é manual. Esses estados não comprovam fila de correção ou fechamento oficial no SUAP/AVA.</p>
          </section>)}
          {!card.copies.length && <p className={styles.note}>{workspace.importStatus === "ready" ? "Nenhuma cópia importada para esta turma e período. Os dados oficiais do SUAP/AVA não são sincronizados automaticamente." : workspace.importStatus === "not_configured" ? "Importação aguardando configuração e homologação; o diário oficial não é sincronizado automaticamente." : "Fonte de importações indisponível. Confira o diário na origem."}</p>}
          <div className={styles.actions}><Link className="button primary" href={`/diario-professor?vinculo=${encodeURIComponent(card.id)}`}><BookOpenCheck size={17} aria-hidden="true"/> Abrir diário</Link><Link className="button soft" href={`/importar-dados-academicos${card.copies[0] ? `?diario=${encodeURIComponent(card.copies[0].id)}` : ""}`}><FileUp size={17} aria-hidden="true"/> Revisar importação</Link></div>
        </article>)}</div>}

    <SectionTitle title="Conflitos para revisar" description="Apenas seus lotes privados, ainda válidos. O registro anterior é preservado e nenhuma alteração é enviada à origem."/>
    {workspace.historyStatus !== "ready" ? <div className="infoBox" role="status">O histórico de conflitos {workspace.historyStatus === "not_configured" ? "aguarda configuração" : "está indisponível"}. Não é possível afirmar que todos os registros estão conciliados.</div>
      : conflicts.length === 0 ? <div className="infoBox">Não há conflitos registrados nas suas prévias válidas e nos filtros atuais. Isso não verifica divergências que ainda não foram importadas.</div>
        : <section className={`card panel ${styles.conflicts}`}><div className="tableScroll"><table className="dataTable"><thead><tr><th>Arquivo</th><th>Conflitos detectados</th><th>Revisão</th></tr></thead><tbody>{conflicts.map((batch) => <tr key={batch.id}><td>{batch.filename}</td><td>{batch.conflicts.length} registro(s) divergente(s)</td><td><Link className="button soft" href={`/importar-dados-academicos/lotes/${batch.id}`}>Abrir prévia e revisar</Link></td></tr>)}</tbody></table></div></section>}
    <p className={styles.footerNote}>Os registros oficiais continuam nos sistemas institucionais. <Link href="/campus/ava-moodle">Consultar orientações de acesso ao AVA</Link>.</p>
  </>;
}
