"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brandMark">S</span>
        <span><strong>SIFCAS</strong><small>Sistema Integrado Federal de Campus,<br/>Administração e Serviços</small></span>
      </Link>
      <nav className="nav">
        {navigation.map((group) => (
          <div className="navGroup" key={group.group}>
            <p>{group.group}</p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`navItem ${pathname === href ? "active" : ""}`}>
                <Icon size={18} strokeWidth={1.9}/><span>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="prototypeNote"><strong>Fase 1</strong><span>Estrutura visual e arquitetura funcional. MAISA será implementada na etapa final.</span></div>
    </aside>
  );
}
