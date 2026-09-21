"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { AppRole } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppChrome({ children, topbar, role }: { children: ReactNode; topbar: ReactNode; role: AppRole | null }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const isAuth = ["/login", "/recuperar-senha", "/nova-senha"].includes(pathname) || pathname.startsWith("/auth/");
  const closeMenu = () => { menu.current?.close(); document.body.style.overflow = ""; };
  useEffect(() => { menu.current?.close(); document.body.style.overflow = ""; }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  if (isAuth) return <div className="authShell"><a className="skipLink" href="#main-content">Pular para o conteúdo</a><div id="main-content">{children}</div></div>;
  return <div className="appShell">
    <a className="skipLink" href="#main-content">Pular para o conteúdo</a>
    <div className="desktopSidebar"><Sidebar role={role} /></div>
    <button type="button" className="mobileMenuButton" onClick={() => { menu.current?.showModal(); document.body.style.overflow = "hidden"; }} aria-label="Abrir menu de navegação" aria-haspopup="dialog"><Menu size={22} /></button>
    <dialog ref={menu} className="mobileDrawer" aria-label="Menu do SIFCAS" onClose={() => { document.body.style.overflow = ""; }} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <button type="button" className="drawerClose" onClick={closeMenu} aria-label="Fechar menu"><X size={22} /></button>
      <Sidebar role={role} onNavigate={closeMenu} />
    </dialog>
    <div className="appMain">{topbar}<main className="pageContainer" id="main-content" tabIndex={-1}>{children}</main><footer className="workspaceFooter"><span>SIFCAS</span><span>Campus Cáceres · Mato Grosso</span></footer><MobileNav signedIn={role !== null} /></div>
  </div>;
}
