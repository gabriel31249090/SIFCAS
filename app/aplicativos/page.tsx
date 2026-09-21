import { PageHeader } from "@/components/UI";
import { ModuleDirectory } from "@/components/ModuleDirectory";
import { getCurrentAccount } from "@/lib/auth";
export default async function AppsPage() {
  const account = await getCurrentAccount();
  const role = account?.accountStatus === "active" ? account.role : null;
  return <><PageHeader title="O campus ao seu alcance." description={role ? "Encontre o que precisa para estudar, trabalhar e resolver sua rotina." : "Explore os serviços públicos. Entre na sua conta para acessar seus aplicativos."} action={<span className="badge">{role ? "Meu catálogo" : "Acesso público"}</span>} /><ModuleDirectory role={role} /></>;
}
