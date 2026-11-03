import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ModuleIconName } from "@/lib/module-catalog";
import { AeroIcon, type AeroTone } from "./AeroIcon";

function headerIcon(title: string): ModuleIconName {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/agenda|calendario|horario/.test(normalized)) return "calendar";
  if (/import|document|recibo/.test(normalized)) return "file";
  if (/edital|oportunidade/.test(normalized)) return "notice";
  if (/diario|disciplina|ensino/.test(normalized)) return "book";
  if (/nota|boletim|avaliac/.test(normalized)) return "grades";
  if (/pessoa|usuario|perfil|vinculo/.test(normalized)) return "users";
  if (/pesquisa|projeto/.test(normalized)) return "research";
  if (/busca|buscar/.test(normalized)) return "search";
  if (/noticia|publicac/.test(normalized)) return "news";
  if (/pendencia|solicitac/.test(normalized)) return "tasks";
  if (/gestao|administrac/.test(normalized)) return "settings";
  return "campus";
}

export function PageHeader({ title, description, action, icon }: { title: string; description: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return <div className="pageHeader"><div className="pageHeaderIdentity">{icon ? <AeroIcon icon={icon} size={25}/> : <AeroIcon name={headerIcon(title)} size={25}/>}<div><h1>{title}</h1><p>{description}</p></div></div>{action}</div>;
}

export function StatCard({ label, value, icon: Icon, foot, tone = "sky" }: { label: string; value: string; icon: LucideIcon; foot?: string; tone?: AeroTone }) {
  return <article className="card statCard"><div><span className="mutedLabel">{label}</span><strong>{value}</strong>{foot && <small>{foot}</small>}</div><AeroIcon icon={Icon} size={20} tone={tone}/></article>;
}

export function ModuleCard({ title, description, icon: Icon, href, badge }: { title: string; description: string; icon: LucideIcon; href?: string; badge?: string }) {
  const content = <><div className="moduleTop"><AeroIcon icon={Icon} size={22}/>{badge && <span className="badge">{badge}</span>}</div><h3>{title}</h3><p>{description}</p></>;
  return href ? <Link href={href} className="card moduleCard">{content}</Link> : <article className="card moduleCard moduleCardStatic">{content}</article>;
}

export function SectionTitle({ title, description, href, linkLabel }: { title: string; description?: string; href?: string; linkLabel?: string }) {
  return <div className="sectionTitle"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{href && <Link href={href}>{linkLabel ?? "Ver tudo"}</Link>}</div>;
}
