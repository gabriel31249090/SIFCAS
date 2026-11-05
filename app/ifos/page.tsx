import { requireAccount } from "@/lib/auth";
import { getAccessibleModules } from "@/lib/module-catalog";
import { getHomeToday } from "@/lib/home-today-server";
import { IFOSDesktop } from "./IFOSDesktop";

export default async function IFOSPage() {
  const account = await requireAccount();
  const modules = getAccessibleModules(account.role);
  const accessiblePaths = new Set(modules.map(({ href }) => href));
  const today = await getHomeToday(account);
  return <IFOSDesktop name={account.fullName} today={{ date: today.today, items: today.items.filter((item) => accessiblePaths.has(item.href.split(/[?#]/)[0])).slice(0, 30), incomplete: today.incomplete, emptyMessage: today.emptyMessage }} modules={modules.map(({ href, label, icon, description, group, keywords }) => ({ href, label, icon, description, group, keywords: keywords ?? "" }))}/>;
}
