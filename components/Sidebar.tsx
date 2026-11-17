"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CircleHelp, LayoutGrid, Leaf } from "lucide-react";
import type { AppRole } from "@/lib/auth";
import { getAccessibleModules, moduleGroups } from "@/lib/module-catalog";
import { Brand } from "./Brand";
import { AeroIcon } from "./AeroIcon";

export function Sidebar({ role, onNavigate }: { role: AppRole | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = getAccessibleModules(role).filter((item) => item.navigation);
  return <aside className="sidebar">
    <Link href={role ? "/" : "/noticias"} className="brand" aria-label="SIFCAS. Campus, pessoas e serviços — início" onClick={onNavigate}><Brand /></Link>
    <div className="campusLabel"><Leaf size={14} aria-hidden="true"/><span>IFMT</span> Campus Cáceres</div>
    <nav className="nav" aria-label="Navegação principal">
      {moduleGroups.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (!groupItems.length) return null;
        return <div className="navGroup" key={group}><p>{group}</p>{groupItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
          return <Link key={item.href} href={item.href} data-experience-href={item.href} className={"navItem " + (active ? "active" : "")} aria-current={active ? "page" : undefined} onClick={onNavigate}><AeroIcon name={item.icon} size={16}/><span>{item.label}</span></Link>;
        })}</div>;
      })}
    </nav>
    <div className="sidebarFooter">
      <Link href="/aplicativos" className="sidebarAllApps" onClick={onNavigate}><AeroIcon icon={LayoutGrid} size={15} tone="sky"/>Todos os aplicativos<ArrowUpRight size={16} aria-hidden="true"/></Link>
      <Link href={role ? "/base-conhecimento" : "/login"} className="sidebarHelp" onClick={onNavigate}><CircleHelp size={17} />{role ? "Precisa de ajuda?" : "Acessar minha conta"}</Link>
      <small>Seu espaço para aprender,<br/>planejar e se conectar.</small>
    </div>
  </aside>;
}
