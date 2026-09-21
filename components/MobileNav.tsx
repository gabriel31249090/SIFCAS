"use client";
import Link from "next/link";
import { LayoutDashboard, LayoutGrid, Search, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: signedIn ? "/" : "/noticias", label: "Início", icon: LayoutDashboard },
    { href: "/aplicativos", label: "Aplicativos", icon: LayoutGrid },
    { href: signedIn ? "/maisa" : "/login?next=/maisa", label: "MAISA", icon: Sparkles },
    { href: "/buscar", label: "Buscar", icon: Search },
    { href: signedIn ? "/perfil" : "/login", label: signedIn ? "Perfil" : "Entrar", icon: UserRound },
  ];
  return <nav className="mobileNav" aria-label="Acessos rápidos no celular">{items.map(({ href, label, icon: Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>;
  })}</nav>;
}
