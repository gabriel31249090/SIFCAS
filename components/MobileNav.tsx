"use client";
import Link from "next/link";
import { LayoutDashboard, LayoutGrid, Search, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { AeroIcon, type AeroTone } from "./AeroIcon";
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: signedIn ? "/" : "/noticias", label: "Início", icon: LayoutDashboard, tone: "sky" },
    { href: "/aplicativos", label: "Aplicativos", icon: LayoutGrid, tone: "leaf" },
    { href: signedIn ? "/maisa" : "/login?next=/maisa", label: "LUMA", icon: Sparkles, tone: "violet" },
    { href: "/buscar", label: "Buscar", icon: Search, tone: "sky" },
    { href: signedIn ? "/perfil" : "/login", label: signedIn ? "Perfil" : "Entrar", icon: UserRound, tone: "leaf" },
  ];
  return <nav className="mobileNav" aria-label="Acessos rápidos no celular">{items.map(({ href, label, icon: Icon, tone }) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    return <Link key={href} href={href} data-experience-href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><AeroIcon icon={Icon} size={14} tone={tone as AeroTone}/><span>{label}</span></Link>;
  })}</nav>;
}
