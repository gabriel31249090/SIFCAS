import { PageHeader } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getAgendaContext } from "@/lib/academic";
import { publishAgendaEntry } from "./actions";

const typeLabels: Record<string, string> = {
  class: "Aula",
  exam: "Prova",
  assignment: "Trabalho",
  activity: "Atividade",
  notice: "Aviso",
  material: "Material",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Cuiaba" }).format(new Date(`${iso}T12:00:00-04:00`));
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "Dia todo";
}

export default async function AgendaAluno({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const account = await requireAccount();
  const params = await searchParams;
  const context = await getAgendaContext(account);
  const byDate = new Map<string, typeof context.entries>();

  context.entries.forEach((entry) => {
    const items = byDate.get(entry.entryDate) ?? [];
    items.push(entry);
    byDate.set(entry.entryDate, items);
  });

  return <>
    <PageHeader
      title="Agenda do Aluno e da Turma"
      description="Planejamento real das turmas: aulas, provas, trabalhos, atividades, materiais e avisos publicados por professores vinculados."
      action={<span className="badge">Dados em tempo real</span>}
    />

    {params.message && <div className="infoBox" style={{ marginBottom: 14 }}>{params.message}</div>}
    {params.error && <div className="infoBox" style={{ marginBottom: 14 }}>{params.error}</div>}

    <div className="agendaGrid">
      <section className="card calendarCard">
        <div className="calendarHead">
          <div><h2>Próximos 35 dias</h2><span className="mutedLabel">A agenda é filtrada automaticamente de acordo com seu vínculo.</span></div>
          <span className="badge">{context.entries.length} publicações</span>
        </div>

        {context.entries.length === 0 ? (
          <div className="infoBox">Ainda não há publicações de agenda disponíveis para seu vínculo acadêmico.</div>
        ) : (
          <div className="weekGrid">
            {[...byDate.entries()].map(([date, entries]) => <article className="dayColumn" key={date}>
              <header><b>{formatDate(date).split(" ")[0].toUpperCase()}</b><span>{formatDate(date).replace(/^\S+\s/, "")}</span></header>
              {entries.map((entry) => <div className="agendaItem" key={entry.id}>
                <strong>{formatTime(entry.startsAt)} • {entry.subjectName}</strong>
                <small>{typeLabels[entry.entryType] ?? entry.entryType} • {entry.title}</small>
                {entry.description && <small>{entry.description}</small>}
                <small>{entry.className}{entry.status === "draft" ? " • Rascunho" : ""}</small>
              </div>)}
            </article>)}
          </div>
        )}
      </section>

      <aside className="card sidePanel">
        <div className="sectionTitle" style={{ marginTop: 0 }}>
          <div><h2>Publicação do professor</h2><p>Somente vínculos autorizados podem publicar.</p></div>
        </div>

        {!context.canPublish ? (
          <div className="infoBox">
            {account.role === "teacher"
              ? "Você ainda não possui uma disciplina/turma vinculada. Um gestor precisa criar o vínculo docente antes da publicação."
              : "Seu perfil possui acesso de leitura à agenda."}
          </div>
        ) : (
          <form className="formStack" action={publishAgendaEntry}>
            <label>Turma e disciplina
              <select name="classSubjectId" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {context.options.map((option) => <option value={option.classSubjectId} key={option.classSubjectId}>{option.label}</option>)}
              </select>
            </label>
            <label>Data<input name="entryDate" type="date" min={context.today} required /></label>
            <label>Horário<input name="startsAt" type="time" /></label>
            <label>Tipo
              <select name="entryType" defaultValue="class">
                <option value="class">Aula</option>
                <option value="exam">Prova</option>
                <option value="assignment">Trabalho</option>
                <option value="activity">Atividade</option>
                <option value="notice">Aviso</option>
                <option value="material">Material</option>
              </select>
            </label>
            <label>Título<input name="title" maxLength={180} required placeholder="Ex.: Revisão de matrizes" /></label>
            <label>Descrição<textarea name="description" maxLength={8000} placeholder="Conteúdo, instruções, materiais ou observações..." /></label>
            <button type="submit" className="button soft">Publicar na agenda</button>
          </form>
        )}
      </aside>
    </div>
  </>;
}
