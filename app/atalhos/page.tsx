import Link from "next/link";
import { Link2, Plus, Trash2 } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getShortcutCatalog, listUserShortcuts } from "@/lib/experience";
import { addShortcut, removeShortcut } from "./actions";

type Params = Promise<{ message?: string; error?: string }>;

export default async function ShortcutsPage({ searchParams }: { searchParams: Params }) {
  const account = await requireAccount();
  const params = await searchParams;
  const [shortcuts, catalog] = await Promise.all([
    listUserShortcuts(account.id),
    Promise.resolve(getShortcutCatalog(account.role)),
  ]);
  const existing = new Set(shortcuts.map((item) => item.href));
  const available = catalog.filter((item) => !existing.has(item.href));

  return <>
    <PageHeader title="Meus Atalhos" description="Monte seu acesso rápido com os módulos que você usa com mais frequência." action={<span className="badge">{shortcuts.length} atalhos</span>}/>
    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <SectionTitle title="Atalhos atuais" description="Eles também aparecem na página inicial do SIFCAS."/>
    {shortcuts.length === 0 ? <div className="infoBox">Você ainda não adicionou atalhos pessoais.</div> : <div className="shortcutManageGrid">
      {shortcuts.map((item) => <article className="card shortcutManageCard" key={item.id}>
        <Link href={item.href}><span className="iconBox"><Link2 size={18}/></span><b>{item.label}</b><small>{item.href}</small></Link>
        <form action={removeShortcut}><input type="hidden" name="id" value={item.id}/><button className="button soft" type="submit"><Trash2 size={14}/> Remover</button></form>
      </article>)}
    </div>}

    <SectionTitle title="Adicionar atalhos" description="A lista já respeita o papel e as permissões da sua conta."/>
    {available.length === 0 ? <div className="infoBox">Todos os módulos disponíveis para o seu perfil já estão nos atalhos.</div> : <div className="shortcutCatalog">
      {available.map((item) => <form action={addShortcut} className="card shortcutCatalogItem" key={item.href}>
        <input type="hidden" name="href" value={item.href}/>
        <div><b>{item.label}</b><small>{item.href}</small></div>
        <button className="button soft" type="submit"><Plus size={14}/> Adicionar</button>
      </form>)}
    </div>}
  </>;
}
