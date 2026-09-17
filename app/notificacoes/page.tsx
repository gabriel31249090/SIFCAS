import Link from "next/link";
import { Bell, CheckCheck, MailOpen, MailWarning } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listNotifications } from "@/lib/institutional";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

type SearchParams = Promise<{ message?: string; error?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const account = await requireAccount();
  const params = await searchParams;
  const notifications = await listNotifications(account.id);
  const unread = notifications.filter((item) => !item.readAt).length;

  return <>
    <PageHeader title="Notificações" description="Avisos institucionais destinados ao seu perfil e atualizações importantes do SIFCAS." action={unread > 0 ? <form action={markAllNotificationsRead}><button className="button soft" type="submit"><CheckCheck size={16}/> Marcar todas como lidas</button></form> : <span className="badge">Tudo em dia</span>}/>

    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid">
      <StatCard label="Não lidas" value={String(unread)} foot="Precisam da sua atenção" icon={MailWarning}/>
      <StatCard label="Lidas" value={String(notifications.length - unread)} foot="Já visualizadas" icon={MailOpen}/>
      <StatCard label="Total" value={String(notifications.length)} foot="Últimas notificações" icon={Bell}/>
      <StatCard label="Canal" value="SIFCAS" foot="Avisos internos" icon={CheckCheck}/>
    </div>

    <SectionTitle title="Caixa de entrada" description="Abra o conteúdo relacionado ou marque a notificação como lida."/>
    {notifications.length === 0 ? <div className="emptyState card"><Bell size={28}/><h2>Nenhuma notificação</h2><p>Novas publicações destinadas ao seu perfil aparecerão aqui.</p></div> : <div className="notificationList">
      {notifications.map((item) => <article className={`card notificationItem ${item.readAt ? "isRead" : "isUnread"}`} key={item.id}>
        <span className="notificationDot"/>
        <div className="notificationBody"><div className="notificationMeta"><b>{item.title}</b><time>{formatDate(item.createdAt)}</time></div><p>{item.body}</p><div className="notificationActions">
          <Link className="button soft" href={item.href}>Abrir</Link>
          {!item.readAt && <form action={markNotificationRead}><input type="hidden" name="id" value={item.id}/><button className="button soft" type="submit">Marcar como lida</button></form>}
        </div></div>
      </article>)}
    </div>}
  </>;
}
