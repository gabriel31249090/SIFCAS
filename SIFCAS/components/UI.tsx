import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="pageHeader"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function StatCard({ label, value, icon: Icon, foot }: { label: string; value: string; icon: LucideIcon; foot?: string }) {
  return <article className="card statCard"><div><span className="mutedLabel">{label}</span><strong>{value}</strong>{foot && <small>{foot}</small>}</div><span className="iconBox"><Icon size={20}/></span></article>;
}

export function ModuleCard({ title, description, icon: Icon, href, badge }: { title: string; description: string; icon: LucideIcon; href?: string; badge?: string }) {
  const content = <><div className="moduleTop"><span className="iconBox"><Icon size={20}/></span>{badge && <span className="badge">{badge}</span>}</div><h3>{title}</h3><p>{description}</p></>;
  return href ? <Link href={href} className="card moduleCard">{content}</Link> : <article className="card moduleCard">{content}</article>;
}

export function SectionTitle({ title, description, href, linkLabel }: { title: string; description?: string; href?: string; linkLabel?: string }) {
  return <div className="sectionTitle"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{href && <Link href={href}>{linkLabel ?? "Ver tudo"}</Link>}</div>;
}
