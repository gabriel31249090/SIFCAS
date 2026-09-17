import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, FileClock, FileText, Megaphone, Newspaper, Pin, Send, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount, roleLabels } from "@/lib/auth";
import { listManagedPublications, listPublicationCampuses, publicationKindLabels, publicationStatusLabels } from "@/lib/institutional";
import { createPublication, setPublicationStatus } from "./actions";

type SearchParams = Promise<{ message?: string; error?: string }>;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function InstitutionalPanelPage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  if (!["staff", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const [publications, campuses] = await Promise.all([listManagedPublications(), listPublicationCampuses()]);
  const published = publications.filter((row) => row.status === "published").length;
  const drafts = publications.filter((row) => row.status === "draft").length;
  const events = publications.filter((row) => row.kind === "event" && row.status === "published").length;

  return <>
    <PageHeader
      title="Painel Institucional"
      description="Publique notícias, comunicados, editais e eventos com público-alvo, agenda e notificações automáticas."
      action={<span className="badge"><ShieldCheck size={13}/> {roleLabels[account.role]}</span>}
    />

    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Publicações" value={String(publications.length)} foot="Total registrado" icon={FileText}/>
      <StatCard label="Publicadas" value={String(published)} foot="Visíveis ao público-alvo" icon={Send}/>
      <StatCard label="Rascunhos" value={String(drafts)} foot="Aguardando publicação" icon={FileClock}/>
      <StatCard label="Eventos" value={String(events)} foot="Eventos publicados" icon={CalendarDays}/>
    </div>

    <SectionTitle title="Nova publicação" description="Salve como rascunho ou publique imediatamente. Ao publicar, o SIFCAS cria notificações para os perfis selecionados."/>
    <section className="card panel institutionalEditor">
      <form action={createPublication} className="formStack">
        <div className="formRow2">
          <label>Tipo
            <select name="kind" defaultValue="news" required>
              <option value="news">Notícia</option><option value="notice">Comunicado</option><option value="edital">Edital</option><option value="event">Evento</option>
            </select>
          </label>
          <label>Referência / número<input name="referenceCode" maxLength={80} placeholder="Ex.: Edital 12/2026"/></label>
        </div>
        <label>Título<input name="title" minLength={3} maxLength={220} required placeholder="Título da publicação"/></label>
        <label>Resumo<textarea name="summary" maxLength={600} placeholder="Resumo curto exibido nas listagens"/></label>
        <label>Conteúdo<textarea name="content" maxLength={20000} className="publicationContentInput" placeholder="Texto completo, orientações, requisitos, programação..."/></label>

        <div className="editorGrid">
          <label>Campus
            <select name="campusId" defaultValue=""><option value="">Todos / institucional</option>{campuses.map((campus) => <option value={campus.id} key={campus.id}>{campus.name}</option>)}</select>
          </label>
          <label>Local<input name="location" maxLength={220} placeholder="Auditório, online, sala..."/></label>
          <label>Link externo<input name="externalUrl" type="url" placeholder="https://..."/></label>
          <label>Visibilidade
            <select name="visibility" defaultValue="public"><option value="public">Pública</option><option value="authenticated">Somente usuários autenticados</option></select>
          </label>
          <label>Início / data do evento<input name="startsAt" type="datetime-local"/></label>
          <label>Fim / prazo<input name="endsAt" type="datetime-local"/></label>
          <label>Expira em<input name="expiresAt" type="datetime-local"/></label>
        </div>

        <fieldset className="audienceFieldset"><legend>Público que receberá notificação</legend><div className="checkboxGrid">
          <label><input type="checkbox" name="audience" value="student" defaultChecked/> Estudantes</label>
          <label><input type="checkbox" name="audience" value="teacher" defaultChecked/> Professores</label>
          <label><input type="checkbox" name="audience" value="staff" defaultChecked/> Servidores</label>
          <label><input type="checkbox" name="audience" value="manager" defaultChecked/> Gestores</label>
          <label><input type="checkbox" name="audience" value="admin" defaultChecked/> Administradores</label>
        </div></fieldset>

        <label className="publishNowCheck"><input type="checkbox" name="publishNow" value="yes"/> Publicar agora e distribuir notificações</label>
        <button className="button primary" type="submit"><Send size={16}/> Salvar publicação</button>
      </form>
    </section>

    <SectionTitle title="Publicações registradas" description="Abra, publique, arquive ou devolva itens para rascunho."/>
    <section className="card panel">
      {publications.length === 0 ? <div className="infoBox">Nenhuma publicação institucional registrada ainda.</div> : <div className="tableScroll"><table className="dataTable"><thead><tr><th>Tipo</th><th>Título</th><th>Status</th><th>Publicação / data</th><th>Ações</th></tr></thead><tbody>
        {publications.map((row) => <tr key={row.id}>
          <td><span className="badge">{publicationKindLabels[row.kind]}</span>{row.referenceCode && <><br/><small>{row.referenceCode}</small></>}</td>
          <td><b>{row.title}</b>{row.summary && <><br/><small>{row.summary}</small></>}</td>
          <td>{publicationStatusLabels[row.status]}</td>
          <td>{formatDate(row.startsAt ?? row.publishedAt ?? row.createdAt)}</td>
          <td><div className="publicationActions">
            <Link className="button soft" href={`/publicacoes/${row.id}`}>Abrir</Link>
            {row.status !== "published" && <form action={setPublicationStatus}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="status" value="published"/><button className="button soft" type="submit">Publicar</button></form>}
            {row.status !== "draft" && <form action={setPublicationStatus}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="status" value="draft"/><button className="button soft" type="submit">Rascunho</button></form>}
            {row.status !== "archived" && <form action={setPublicationStatus}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="status" value="archived"/><button className="button soft" type="submit">Arquivar</button></form>}
          </div></td>
        </tr>)}
      </tbody></table></div>}
    </section>

    <div className="quickGrid" style={{ marginTop: 18 }}>
      <Link href="/noticias"><Newspaper/>Ver notícias</Link><Link href="/editais"><Pin/>Ver editais</Link><Link href="/agenda-institucional"><CalendarDays/>Ver agenda</Link><Link href="/notificacoes"><Megaphone/>Minhas notificações</Link>
    </div>
  </>;
}
