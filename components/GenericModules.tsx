import { ModuleCard, PageHeader } from "./UI";
import type { LucideIcon } from "lucide-react";

export type Module = { title: string; description: string; icon: LucideIcon; badge?: string; href?: string };
export function GenericModules({ title, description, modules, notice }: { title: string; description: string; modules: Module[]; notice?: string }) {
  return <><PageHeader title={title} description={description}/>{notice && <div className="infoBox moduleNotice" role="status">{notice}</div>}<div className="moduleGrid">{modules.map((m)=><ModuleCard key={m.title} {...m}/>)}</div></>;
}
