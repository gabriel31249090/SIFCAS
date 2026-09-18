import Link from "next/link";
import { Bell, BookOpenCheck, Megaphone, Settings2, Wrench } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getNotificationPreferences } from "@/lib/experience";
import { saveNotificationPreferences } from "./actions";

type Params = Promise<{ message?: string; error?: string }>;

export default async function NotificationPreferencesPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  const params = await searchParams;
  const prefs = await getNotificationPreferences(account.id);

  return <>
    <PageHeader title="Preferências de Notificações" description="Escolha quais categorias podem gerar novos avisos na sua caixa de entrada." action={<Link className="button soft" href="/notificacoes"><Bell size={15}/> Voltar às notificações</Link>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <SectionTitle title="Categorias" description="As alterações valem para novas notificações; avisos antigos permanecem no histórico."/>
    <form action={saveNotificationPreferences} className="card panel preferenceList">
      <label className="preferenceRow"><span className="iconBox"><Megaphone size={18}/></span><span><b>Publicações institucionais</b><small>Notícias, editais, comunicados e eventos direcionados ao seu perfil.</small></span><input type="checkbox" name="institutional" defaultChecked={prefs.institutional}/></label>
      <label className="preferenceRow"><span className="iconBox"><Wrench size={18}/></span><span><b>Solicitações e chamados</b><small>Mudanças de status e respostas da Central de Solicitações.</small></span><input type="checkbox" name="serviceRequests" defaultChecked={prefs.serviceRequests}/></label>
      <label className="preferenceRow"><span className="iconBox"><BookOpenCheck size={18}/></span><span><b>Acadêmico</b><small>Reserva para avisos acadêmicos como avaliações, turma e diário.</small></span><input type="checkbox" name="academic" defaultChecked={prefs.academic}/></label>
      <label className="preferenceRow"><span className="iconBox"><Settings2 size={18}/></span><span><b>Sistema</b><small>Mensagens operacionais e de segurança do SIFCAS.</small></span><input type="checkbox" name="system" defaultChecked={prefs.system}/></label>
      <button className="button primary" type="submit">Salvar preferências</button>
    </form>
  </>;
}
