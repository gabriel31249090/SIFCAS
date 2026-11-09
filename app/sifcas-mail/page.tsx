import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listMailClasses, mailConfigured, mailDashboard } from "@/lib/sifcas-mail/service";
import { MAIL_BATCH_SIZE, MAIL_DAILY_SAFETY_LIMIT } from "@/lib/sifcas-mail/templates";
import { disconnectMyGoogle, processMyMail, queueMail } from "./actions";

type Params = Promise<{ message?: string; error?: string }>;

export default async function SifcasMailPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const configured = mailConfigured();
  let classes: Awaited<ReturnType<typeof listMailClasses>> = [];
  let history: Awaited<ReturnType<typeof mailDashboard>> | null = null;
  let unavailable = false;
  try {
    classes = await listMailClasses(account);
    if (configured) history = await mailDashboard(account.id);
  } catch { unavailable = true; }
  const connected = Boolean(history?.connectedEmail);
  const queued = history?.campaigns.reduce((sum, item) => sum + item.pending, 0) ?? 0;
  const sent = history?.campaigns.reduce((sum, item) => sum + item.sent, 0) ?? 0;
  const automaticEnabled = process.env.SIFCAS_MAIL_AUTOMATIC_ASSESSMENTS === "true";

  return <>
    <PageHeader title="SIFCAS Mail" icon={Mail} description="Comunicados personalizados para suas turmas, com envio individual pelo Gmail e rastreabilidade." action={<Link className="button soft" href="/minhas-turmas">Minhas turmas</Link>}/>
    {params.message && <div role="status" className="infoBox successBox">{params.message}</div>}
    {params.error && <div role="alert" className="infoBox errorBox">{params.error}</div>}
    {!configured && <div role="status" className="infoBox">O envio está desativado até que o administrador configure Google OAuth, criptografia e a conexão protegida com o banco. Nenhuma mensagem será enviada enquanto isso.</div>}
    {unavailable && <div role="alert" className="infoBox errorBox">Não foi possível verificar o vínculo acadêmico ou a extensão SIFCAS Mail no banco. O envio permanece indisponível.</div>}
    <div className="statGrid">
      <StatCard label="Conta Google" value={connected ? "Conectada" : "Desconectada"} foot={history?.connectedEmail ?? "OAuth com permissão de envio"} icon={ShieldCheck}/>
      <StatCard label="Enviados" value={String(sent)} foot="Últimas 12 campanhas" icon={Send}/>
      <StatCard label="Na fila" value={String(queued)} foot="Últimas 12 campanhas" icon={Mail}/>
    </div>

    <div className="twoCols dashboardLower">
      <section className="card panel">
        <SectionTitle title="Remetente Gmail" description="Conexão individual com o Google; sua senha nunca passa pelo SIFCAS."/>
        {connected ? <>
          <div className="infoBox successBox">Remetente autorizado: {history?.connectedEmail}</div>
          <form action={disconnectMyGoogle}><button className="button soft" type="submit">Desconectar Google</button></form>
        </> : <>
          <p>Conecte seu Gmail ou Google Workspace. O SIFCAS solicitará apenas o escopo de envio, além da identificação do e-mail.</p>
          {configured && !unavailable && <Link className="button primary" href="/api/sifcas-mail/google/connect">Conectar minha conta Google</Link>}
        </>}
        <p className="mutedLabel">Limite preventivo: {MAIL_DAILY_SAFETY_LIMIT} mensagens confirmadas por conta a cada 24 h. O Gmail também aplica suas próprias cotas.</p>
        <p className="mutedLabel">Avisos automáticos de novas avaliações: {automaticEnabled ? "habilitados pelo administrador" : "desativados até configuração explícita"}.</p>
      </section>
      <section className="card panel">
        <SectionTitle title="Processamento" description="Sem servidor SMTP: as mensagens são entregues pela API oficial do Gmail."/>
        <p>O processamento manual envia até {MAIL_BATCH_SIZE} mensagens por chamada. A rotina de produção pode processar até 50 mensagens diariamente às 08h (Cuiabá), e você pode antecipar os pendentes.</p>
        <form action={processMyMail}><button className="button soft" type="submit" disabled={!connected || unavailable}>Processar minha fila agora</button></form>
        <div className="infoBox">Envios agendados após o processamento diário podem aguardar até o dia seguinte. Reenvios após falhas não são garantidos livres de duplicação em caso de interrupção da infraestrutura.</div>
      </section>
    </div>

    <section className="card panel">
      <SectionTitle title="Novo comunicado" description="Todos os alunos matriculados na turma recebem um e-mail individual; não são aceitos destinatários externos digitados manualmente."/>
      {!classes.length ? <div className="infoBox">Nenhuma turma ativa e autorizada foi encontrada para sua conta.</div> : <form className="formStack" action={queueMail}>
        <label>Turma e disciplina<select name="classSubjectId" required defaultValue={classes[0]?.classSubjectId}>
          {classes.map((option) => <option key={option.classSubjectId} value={option.classSubjectId}>{option.label}</option>)}
        </select></label>
        <label>Assunto<input name="subject" minLength={3} maxLength={150} required defaultValue="Comunicado para {{turma}}"/></label>
        <label>Mensagem<textarea name="body" rows={9} minLength={10} maxLength={5000} required defaultValue={"Olá, {{nome}}!\n\nTemos um comunicado para sua turma {{turma}}, na disciplina {{disciplina}}.\n\nAtenciosamente, {{professor}}\n{{sifcas_url}}"}/></label>
        <div className="infoBox">Variáveis disponíveis: <code>{"{{nome}}"}</code>, <code>{"{{turma}}"}</code>, <code>{"{{disciplina}}"}</code>, <code>{"{{professor}}"}</code>, <code>{"{{data}}"}</code> e <code>{"{{sifcas_url}}"}</code>.</div>
        <label>Agendamento opcional — horário de Cáceres/MT<input name="schedule" type="datetime-local"/></label>
        <button className="button primary" type="submit" disabled={!connected || unavailable}>Criar e iniciar envio individual</button>
      </form>}
    </section>

    <section className="card panel">
      <SectionTitle title="Histórico de comunicados" description="Progresso dos seus últimos 12 envios, sem divulgar os endereços dos estudantes."/>
      {!history?.campaigns.length ? <div className="infoBox">Nenhum comunicado cadastrado nesta conta.</div> : <div className="tableScroll"><table className="dataTable"><thead><tr><th>Assunto</th><th>Origem</th><th>Criado em</th><th>Enviados</th><th>Fila</th><th>Falhas</th></tr></thead><tbody>
        {history.campaigns.map((campaign) => <tr key={campaign.id}><td>{campaign.subject_template}</td><td>{campaign.category === "manual" ? "Professor" : "Avaliação automática"}</td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(campaign.created_at))}</td><td>{campaign.sent}</td><td>{campaign.pending}</td><td>{campaign.failed}</td></tr>)}
      </tbody></table></div>}
    </section>
  </>;
}
