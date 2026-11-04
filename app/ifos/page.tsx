import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getAccessibleModules } from "@/lib/module-catalog";
import { getHomeToday } from "@/lib/home-today-server";
import { IFOSDesktop } from "./IFOSDesktop";

export default async function IFOSPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  const today = await getHomeToday(account);
  return <IFOSDesktop name={account.fullName} today={{ date: today.today, items: today.items.slice(0, 30), incomplete: today.incomplete, emptyMessage: today.emptyMessage }} modules={getAccessibleModules(account.role).map(({ href, label, icon, description, group, keywords }) => ({ href, label, icon, description, group, keywords: keywords ?? "" }))}/>;
}
