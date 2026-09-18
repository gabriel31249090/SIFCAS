"use client";

import Link from "next/link";
import { Bell, Bot, Home, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/maisa", label: "MAISA", icon: Bot },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/notificacoes", label: "Avisos", icon: Bell },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();
  return <nav className="mobileNav" aria-label="Navegação móvel">
    {items.map(({ href, label, icon: Icon }) => {
      const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(\`\${href}/\`);
      return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={19}/><span>{label}</span></Link>;
    })}
  </nav>;
}
