"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Leaf, MapPin, ArrowUpRight } from "lucide-react";
import type { AppRole } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { AeroIcon } from "./AeroIcon";
import { StudentExperienceProvider } from "./StudentExperienceProvider";

export function AppChrome({ children, topbar, role, accountId }: { children: ReactNode; topbar: ReactNode; role: AppRole | null; accountId: string | null }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const isAuth = ["/login", "/recuperar-senha", "/nova-senha"].includes(pathname) || pathname.startsWith("/auth/");
  const closeMenu = () => { menu.current?.close(); document.body.style.overflow = ""; };
  useEffect(() => { menu.current?.close(); document.body.style.overflow = ""; }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  if (isAuth) return <div className="authShell"><a className="skipLink" href="#main-content">Pular para o conteúdo</a><div id="main-content">{children}</div></div>;
  if (pathname === "/ifos") return <StudentExperienceProvider key={accountId ?? "anonymous"} userId={accountId} enabled={role !== null} role={role}><div className="ifosShell"><a className="skipLink" href="#main-content">Pular para o conteúdo</a>{children}</div></StudentExperienceProvider>;
  return <StudentExperienceProvider key={accountId ?? "anonymous"} userId={accountId} enabled={role !== null} role={role}><div className="appShell">
    <a className="skipLink" href="#main-content">Pular para o conteúdo</a>
    <div className="desktopSidebar"><Sidebar role={role} /></div>
    <button type="button" className="mobileMenuButton" onClick={() => { menu.current?.showModal(); document.body.style.overflow = "hidden"; }} aria-label="Abrir menu de navegação" aria-haspopup="dialog"><Menu size={22} /></button>
    <dialog ref={menu} className="mobileDrawer" aria-label="Menu do SIFCAS" onClose={() => { document.body.style.overflow = ""; }} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <button type="button" className="drawerClose" onClick={closeMenu} aria-label="Fechar menu"><X size={22} /></button>
      <Sidebar role={role} onNavigate={closeMenu} />
    </dialog>
    <div className="appMain">{topbar}<main className="pageContainer" id="main-content" tabIndex={-1}>{children}</main><footer className="workspaceFooter">
      <div className="footerIdentity"><AeroIcon icon={Leaf} tone="leaf" size={18}/><div><strong>SIFCAS<span>.</span></strong><small>Um campus de possibilidades.</small></div></div>
      <nav className="footerLinks" aria-label="Links do rodapé"><Link href="/campus">Guia do campus</Link><Link href="/editais">Editais</Link><a href="https://cas.ifmt.edu.br/" target="_blank" rel="noopener noreferrer">Portal oficial<ArrowUpRight size={13} aria-hidden="true"/></a></nav>
      <div className="footerPlace"><span><MapPin size={13} aria-hidden="true"/>Cáceres · Mato Grosso</span><small>Projeto independente. Fontes oficiais sempre identificadas.</small></div>
    </footer><MobileNav signedIn={role !== null} /></div>
  </div></StudentExperienceProvider>;
}
