"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Expand, Grid2X2, Grip, Leaf, Minus, Monitor, Search, Settings2, Sparkles, Square, Star, Timer, X } from "lucide-react";
import type { ModuleIconName } from "@/lib/module-catalog";
import type { TodayItem } from "@/lib/home-today";
import { matchesSearch } from "@/lib/search-utils";
import { experienceCss, type StudentExperience } from "@/lib/student-experience";
import { aeroWallpapers } from "@/lib/aero-assets";
import { useStudentExperience } from "@/components/StudentExperienceProvider";
import { ModuleIcon } from "@/components/ModuleIcon";
import { PixelBurst } from "@/components/PixelBurst";
import { FocusTools } from "@/components/FocusTimer";
import { AeroArtwork, ExperienceSticker, ExperienceWallpaper } from "@/components/AeroArtwork";
import { clampIFOSGeometry, ifosWorkspaceStorageKey, maxIFOSWindows, parseIFOSWorkspace, resizeIFOSGeometry, serializeIFOSWorkspace, type IFOSGeometry, type IFOSViewport } from "@/lib/ifos-workspace";

type DesktopModule = { href: string; label: string; icon: ModuleIconName; description: string; group: string; keywords: string };
type DesktopWindow = IFOSGeometry & { app: DesktopModule; minimized: boolean; maximized: boolean };
type TodaySummary = { date: string; items: TodayItem[]; incomplete: boolean; emptyMessage: string };
const focusApp: DesktopModule = { href: "#focus", label: "Meu foco", icon: "calendar", description: "Um passo de cada vez. Reserve um tempo para aprender.", group: "Meu espaço", keywords: "timer pomodoro estudo cronometro" };
const primaryApps = ["/boletim", "/agenda-aluno", "/disciplinas", "/horarios", "/avaliacoes", "/diario-professor", "/gestao-academica", "/usuarios", "/painel-institucional", "/servicos", "/editais", "/solicitacoes", "/personalizacao"];
const appColors = ["blue", "green", "violet", "amber", "teal", "rose"];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const frame = window.requestAnimationFrame(update);
    const timer = window.setInterval(update, 15_000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, []);
  return {
    dateKey: now ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Cuiaba" }).format(now) : null,
    time: now ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" }).format(now) : "--:--",
    date: now ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Cuiaba" }).format(now) : "Seu campus digital",
    weekday: now ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Cuiaba" }).format(now) : "IFMT · Cáceres",
  };
}

function MiniCalendar({ date }: { date: string }) {
  const [offset, setOffset] = useState(0);
  const shown = new Date(`${date}T12:00:00Z`);
  shown.setUTCDate(1);
  shown.setUTCMonth(shown.getUTCMonth() + offset);
  const count = new Date(Date.UTC(shown.getUTCFullYear(), shown.getUTCMonth() + 1, 0)).getUTCDate();
  const blanks = (shown.getUTCDay() + 6) % 7;
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(shown);
  return <div className="osCalendar"><div className="osCalendarHeading"><strong>{month}</strong><span><button type="button" aria-label="Mês anterior" onClick={() => setOffset((value) => value - 1)}><ChevronLeft size={15}/></button><button type="button" aria-label="Próximo mês" onClick={() => setOffset((value) => value + 1)}><ChevronRight size={15}/></button></span></div><div className="osCalendarGrid" aria-label={month}>{["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => <small key={`day-${i}`}>{day}</small>)}{Array.from({ length: blanks }, (_, i) => <span key={`blank-${i}`} aria-hidden="true"/>)}{Array.from({ length: count }, (_, i) => <span key={i} className={offset === 0 && i + 1 === Number(date.slice(-2)) ? "today" : ""}>{i + 1}</span>)}</div></div>;
}

export function IFOSDesktop({ name, modules, today }: { name: string; modules: DesktopModule[]; today: TodaySummary }) {
  const { storageKey } = useStudentExperience();
  // Account or permission changes remount the desktop before any previous windows can render.
  return <IFOSWorkspaceDesktop key={`${storageKey}:${modules.map((item) => item.href).join("|")}`} name={name} modules={modules} today={today}/>;
}

function IFOSWorkspaceDesktop({ name, modules, today }: { name: string; modules: DesktopModule[]; today: TodaySummary }) {
  const { preferences, update, storageKey } = useStudentExperience();
  const workspaceKey = ifosWorkspaceStorageKey(storageKey);
  const clock = useClock();
  const desktop = useRef<HTMLElement>(null);
  const startPanel = useRef<HTMLElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ href: string; pointerX: number; pointerY: number; geometry: IFOSGeometry; resize: boolean } | null>(null);
  const latestWorkspace = useRef<string | null>(null);
  const [smallScreen, setSmallScreen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("Todos");
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [storageNoticeDismissed, setStorageNoticeDismissed] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [burst, setBurst] = useState(0);
  const [viewport, setViewport] = useState<IFOSViewport>({ width: 1200, height: 800 });
  const availableModules = useMemo(() => [...modules.filter((item) => item.href !== "/ifos"), focusApp], [modules]);
  const favoriteModules = preferences.favorites.flatMap((href) => availableModules.filter((item) => item.href === href));
  const desktopModules = [...favoriteModules, ...availableModules.filter((item) => primaryApps.includes(item.href) && !preferences.favorites.includes(item.href)), ...availableModules.filter((item) => !primaryApps.includes(item.href) && !preferences.favorites.includes(item.href))].slice(0, 8);
  const filteredModules = availableModules.filter((item) => (group === "Todos" || group === item.group) && matchesSearch(`${item.label} ${item.description} ${item.keywords}`, search));
  const groups = ["Todos", ...new Set(availableModules.map((item) => item.group))];
  const activeHref = !showDesktop ? windows.filter((item) => !item.minimized).at(-1)?.app.href : undefined;
  const agendaApp = availableModules.find((item) => item.href === "/agenda-aluno") ?? availableModules.find((item) => item.href === "/agenda-institucional");
  const settingsApp = availableModules.find((item) => item.href === "/personalizacao");
  const currentDate = clock.dateKey ?? today.date;
  const focusedToday = preferences.focusDate === currentDate ? preferences.focusMinutes : 0;
  const goalProgress = Math.min(100, Math.round(focusedToday / preferences.studyGoalMinutes * 100));
  const firstName = preferences.displayName || name.trim().split(/\s+/)[0];

  function desktopViewport(): IFOSViewport {
    return { width: Math.min(desktop.current?.clientWidth ?? window.innerWidth, window.innerWidth), height: Math.min(desktop.current?.clientHeight ?? window.innerHeight, window.innerHeight) };
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // A phone visit must not shrink and overwrite a saved computer layout.
      if (workspaceReady || window.innerWidth < 900) return;
      const nextViewport = desktopViewport();
      setViewport(nextViewport);
      try {
        const saved = parseIFOSWorkspace(window.localStorage.getItem(workspaceKey), new Set(availableModules.map((item) => item.href)), nextViewport);
        setWindows(saved.windows.flatMap(({ href, ...layout }) => {
          const app = availableModules.find((item) => item.href === href);
          return app ? [{ app, ...layout }] : [];
        }));
        setShowDesktop(saved.showDesktop);
      } catch {
        setStorageError("Não foi possível carregar a organização das janelas. Você pode continuar usando o IFOS nesta aba.");
      }
      setWorkspaceReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [availableModules, workspaceKey, smallScreen, workspaceReady]);

  useEffect(() => {
    if (!workspaceReady) return;
    const serialized = serializeIFOSWorkspace(windows.map(({ app, ...layout }) => ({ href: app.href, ...layout })), showDesktop);
    latestWorkspace.current = serialized;
    const save = () => {
      try { window.localStorage.setItem(workspaceKey, serialized); }
      catch { setStorageError("Não foi possível salvar a organização das janelas. As alterações valem só nesta aba."); }
    };
    const timer = window.setTimeout(save, 200);
    return () => window.clearTimeout(timer);
  }, [workspaceReady, workspaceKey, windows, showDesktop]);

  useEffect(() => {
    // Flush the last movement when leaving before the debounced save runs.
    const flush = () => {
      if (latestWorkspace.current === null) return;
      try { window.localStorage.setItem(workspaceKey, latestWorkspace.current); } catch { /* The in-page notice covers unavailable storage. */ }
    };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [workspaceKey]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const check = () => setSmallScreen(!media.matches);
    const frame = window.requestAnimationFrame(check);
    media.addEventListener("change", check);
    const fullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", fullscreenChange);
    return () => { window.cancelAnimationFrame(frame); media.removeEventListener("change", check); document.removeEventListener("fullscreenchange", fullscreenChange); if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); };
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setStartOpen(true); searchInput.current?.focus(); }
      if (event.key === "Escape" && startPanel.current) { setStartOpen(false); startButton.current?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);

  useEffect(() => {
    if (!startOpen) return;
    searchInput.current?.focus();
    const dismiss = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !startPanel.current?.contains(event.target) && !startButton.current?.contains(event.target)) setStartOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [startOpen]);

  useEffect(() => {
    const clamp = () => {
      if (!desktop.current || window.innerWidth < 900) return;
      const nextViewport = desktopViewport();
      setViewport(nextViewport);
      setWindows((current) => current.map((item) => ({ ...item, ...clampIFOSGeometry(item, nextViewport) })));
    };
    const frame = window.requestAnimationFrame(clamp);
    window.addEventListener("resize", clamp);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", clamp); };
  }, [smallScreen]);

  function activate(href: string) {
    setShowDesktop(false);
    setWindows((current) => {
      const found = current.find((item) => item.app.href === href);
      return found ? [...current.filter((item) => item !== found), { ...found, minimized: false }] : current;
    });
  }

  function openApp(app: DesktopModule) {
    if (windows.length >= maxIFOSWindows && !windows.some((item) => item.app.href === app.href)) {
      setError(`Você já abriu ${maxIFOSWindows} janelas. Feche uma delas para abrir outro aplicativo.`);
      return;
    }
    setStartOpen(false);
    setShowDesktop(false);
    setWindows((current) => {
      const found = current.find((item) => item.app.href === app.href);
      if (found) return [...current.filter((item) => item !== found), { ...found, minimized: false }];
      if (current.length >= maxIFOSWindows) return current;
      const bounds = desktopViewport();
      return [...current, { app, ...clampIFOSGeometry({ x: Math.max(140, bounds.width * .22) + (current.length % 4) * 26, y: 100 + (current.length % 4) * 30, width: 550, height: 480 }, bounds), minimized: false, maximized: false }];
    });
    window.requestAnimationFrame(() => document.getElementById(`os-window-${app.href}`)?.focus({ preventScroll: true }));
  }

  function changeWindow(href: string, patch: Partial<DesktopWindow>) {
    setWindows((current) => current.map((item) => item.app.href === href ? { ...item, ...patch } : item));
  }

  function closeWindow(href: string) {
    setWindows((current) => current.filter((item) => item.app.href !== href));
    startButton.current?.focus();
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, item: DesktopWindow, resize = false) {
    if (event.button !== 0 || item.maximized) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    activate(item.app.href);
    drag.current = { href: item.app.href, pointerX: event.clientX, pointerY: event.clientY, geometry: item, resize };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current || !desktop.current) return;
    const { href, pointerX, pointerY, geometry, resize } = drag.current;
    const deltaX = event.clientX - pointerX;
    const deltaY = event.clientY - pointerY;
    changeWindow(href, resize ? resizeIFOSGeometry(geometry, { width: deltaX, height: deltaY }, desktopViewport()) : clampIFOSGeometry({ ...geometry, x: geometry.x + deltaX, y: geometry.y + deltaY }, desktopViewport()));
  }

  function toggleFavorite(app: DesktopModule) {
    if (preferences.favorites.includes(app.href)) update({ favorites: preferences.favorites.filter((href) => href !== app.href) });
    else { update({ favorites: [...preferences.favorites, app.href] }); setBurst((value) => value + 1); }
  }

  async function toggleFullscreen() {
    setError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setError("A tela cheia não está disponível neste navegador. Continue usando o IFOS nesta janela."); }
  }

  if (smallScreen) return <main id="main-content" className="osMobile"><div className="osMobileArt"><Monitor size={48}/><Sparkles size={20}/></div><span className="osLabel">IFOS · SEU CAMPUS DIGITAL</span><h1>Disponível em computadores</h1><p>Um espaço com janelas, atalhos e ferramentas para estudar do seu jeito. Abra em uma tela com pelo menos 900 px.</p><Link className="button primary" href="/">Continuar no SIFCAS <ArrowRight size={17}/></Link><Link href="/personalizacao">Personalizar meu SIFCAS</Link></main>;

  return <main ref={desktop} id="main-content" tabIndex={-1} className="ifosDesktop osDesktop" data-wallpaper={preferences.wallpaper} style={{ backgroundImage: experienceCss(preferences).wallpaper }} aria-label="IFOS, área de trabalho do SIFCAS">
    <ExperienceWallpaper/>
    <div className="osScenery" aria-hidden="true"><div className="osSun"/><div className="osHill osHillBack"/><div className="osHill"/><i/><i/><i/><i/></div>
    <ExperienceSticker/>
    <header className="osTopbar"><Link href="/" className="osBrand" aria-label="IFOS, voltar ao SIFCAS"><span className="osBrandMark"><Leaf size={21}/></span><b>if<span>os</span><sup>beta</sup></b><span className="osBrandDivider"/><small>Seu campus digital.</small></Link><div className="osTopActions"><span className="osCampus"><span/> IFMT · Cáceres</span><button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"} title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}><Expand size={17}/></button><Link href="/" className="osExit">Voltar ao SIFCAS <ArrowUpRight size={14}/></Link></div></header>
    <nav className="osDesktopApps" aria-label="Aplicativos do IFOS">{desktopModules.map((app, index) => <button type="button" className="osDesktopApp" key={app.href} onClick={() => openApp(app)}><span className={`osAppTile ${appColors[index % appColors.length]}`}><ModuleIcon name={app.icon} size={28}/><i/></span><strong>{app.label}</strong>{windows.some((item) => item.app.href === app.href) && <small className="osRunningDot"/>}</button>)}<button type="button" className="osDesktopApp" onClick={() => { setGroup("Todos"); setSearch(""); setStartOpen(true); }}><span className="osAppTile glass"><Grid2X2 size={27}/></span><strong>Todos os apps</strong></button></nav>
    <section className="osWelcome"><span className="osWelcomeTag"><Sparkles size={13}/> UM MUNDO DE POSSIBILIDADES</span><h1>{preferences.greeting},<br/><span>{firstName}.</span></h1><p>Um novo dia.<br/>Um campus inteiro para explorar.</p><button type="button" onClick={() => { setStartOpen(true); setGroup("Todos"); }}><Search size={16}/> O que vamos fazer hoje? <kbd>Ctrl K</kbd></button><div className="osWelcomeNote"><span className="osPixelFlower" aria-hidden="true">✦</span><span>Aprenda. Explore. Faça acontecer.</span></div></section>
    <aside className="osGadgets" aria-label="Widgets da área de trabalho"><article className="osGadget osClock"><div className="osGadgetLabel"><span><span className="osLiveDot"/> HORÁRIO DE CUIABÁ</span><Leaf size={14}/></div><strong className="osBigTime">{clock.time}</strong><p>{clock.weekday}, {clock.date}</p><MiniCalendar date={currentDate}/></article><article className="osGadget osAgenda"><div className="osGadgetLabel"><span><CalendarDays size={14}/> NO SEU RADAR</span><small>Próximos dias</small></div>{today.items.length ? today.items.slice(0, 2).map((item) => <Link key={`${item.sourceId}:${item.id}`} href={item.href}><span className="osEventDay">{item.date.slice(-2)}<small>{new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(new Date(`${item.date}T12:00:00Z`)).replace(".", "")}</small></span><span><strong>{item.title}</strong><small>{item.time ?? "Dia inteiro"} · {item.sourceLabel}</small></span><ChevronRight size={14}/></Link>) : <p className="osEmptyAgenda">Uma pausa no radar.<small>{today.emptyMessage}</small></p>}{agendaApp && <button type="button" className="osTextButton" onClick={() => openApp(agendaApp)}>Ver minha agenda <ArrowUpRight size={14}/></button>}</article><article className="osGadget osFocus"><div className="osGadgetLabel"><span><Timer size={14}/> UM TEMPO PARA VOCÊ</span><span className="osPixelBadge">FOCO</span></div><div className="osFocusHeading"><strong>{focusedToday}<small> / {preferences.studyGoalMinutes} min</small></strong><span>{goalProgress}%</span></div><progress max={100} value={goalProgress} aria-label="Meta diária de estudo"/><button type="button" onClick={() => openApp(focusApp)}>Começar sessão de foco <ArrowRight size={15}/></button></article></aside>
    {windows.map((item, index) => <section key={item.app.href} id={`os-window-${item.app.href}`} tabIndex={-1} className={`osWindow ${item.maximized ? "osMaximized" : ""} ${activeHref === item.app.href ? "osActiveWindow" : ""}`} style={{ left: item.maximized ? 10 : item.x, top: item.maximized ? 72 : item.y, width: item.maximized ? Math.max(1, viewport.width - 20) : item.width, height: item.maximized ? Math.max(1, viewport.height - 141) : item.height, zIndex: 20 + index }} hidden={item.minimized || showDesktop} role="dialog" aria-modal="false" aria-label={item.app.label} onPointerDown={() => { if (activeHref !== item.app.href) activate(item.app.href); }} onFocusCapture={() => { if (activeHref !== item.app.href) activate(item.app.href); }}>
      <header className="osWindowBar"><button type="button" className="osWindowDrag" onClick={() => activate(item.app.href)} onDoubleClick={() => changeWindow(item.app.href, { maximized: !item.maximized })} onPointerDown={(event) => startDrag(event, item)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={(event) => {
        if (!event.key.startsWith("Arrow") || item.maximized) return;
        event.preventDefault();
        changeWindow(item.app.href, clampIFOSGeometry({ ...item, x: item.x + (event.key === "ArrowRight" ? 20 : event.key === "ArrowLeft" ? -20 : 0), y: item.y + (event.key === "ArrowDown" ? 20 : event.key === "ArrowUp" ? -20 : 0) }, desktopViewport()));
      }} aria-label={`Mover janela ${item.app.label}. Use as setas do teclado.`}><ModuleIcon name={item.app.icon} size={16}/><strong>{item.app.label}</strong></button><div className="osWindowControls"><button type="button" onClick={() => { changeWindow(item.app.href, { minimized: true }); startButton.current?.focus(); }} aria-label={`Minimizar ${item.app.label}`}><Minus size={15}/></button><button type="button" onClick={() => changeWindow(item.app.href, { maximized: !item.maximized })} aria-label={`${item.maximized ? "Restaurar" : "Maximizar"} ${item.app.label}`}><Square size={12}/></button><button type="button" onClick={() => closeWindow(item.app.href)} aria-label={`Fechar ${item.app.label}`}><X size={16}/></button></div></header>
      <div className="osWindowBody"><div className="osWindowBreadcrumb"><span>IFOS</span><ChevronRight size={12}/>{item.app.group}<ChevronRight size={12}/><b>{item.app.label}</b></div>
        {item.app.href === focusApp.href ? <FocusTools compact/> : <><div className="osWindowIntro"><span className={`osAppTile ${appColors[index % appColors.length]}`}><ModuleIcon name={item.app.icon} size={27}/></span><div><span className="osLabel">{item.app.group}</span><h2>{item.app.label}</h2></div></div><p className="osWindowDescription">{item.app.description}</p>
          {item.app.href === "/agenda-aluno" && <div className="osWindowAgenda">{today.items.length ? today.items.slice(0, 8).map((event) => <Link key={`${event.sourceId}:${event.id}`} href={event.href}><span>{event.date.slice(8)}/{event.date.slice(5, 7)}<small>{event.time ?? "Dia inteiro"}</small></span><div><strong>{event.title}</strong><p>{event.detail}</p><small>{event.sourceLabel}{event.imported ? " · Cópia de leitura" : ""}</small></div><ArrowUpRight size={14}/></Link>) : <p>{today.emptyMessage}</p>}{today.incomplete && <small className="osSourceNote">Confira também o SUAP e o AVA. Algumas fontes ainda não estão conectadas.</small>}</div>}
          {item.app.href === "/personalizacao" && <div className="osQuickPersonalize"><span className="osLabel">TROQUE O CENÁRIO</span><div>{([ ["sky", "Céu Aero"], ["meadow", "Jardim"], ["aurora", "Aurora"], ["photo-lake", "Lago alpino"] ] as const).map(([wallpaper, label]) => <button type="button" key={wallpaper} className={`osWallpaperChoice ${wallpaper}`} aria-pressed={preferences.wallpaper === wallpaper} onClick={() => { update({ wallpaper }); setBurst((value) => value + 1); }}><span>{preferences.wallpaper === wallpaper && <Check size={17}/>}</span><strong>{label}</strong></button>)}{aeroWallpapers.slice(0, 3).map((asset) => <button type="button" key={asset.id} className="osWallpaperChoice osWallpaperChoiceAsset" aria-pressed={preferences.wallpaper === asset.id} onClick={() => { update({ wallpaper: asset.id as StudentExperience["wallpaper"] }); setBurst((value) => value + 1); }}><span><AeroArtwork asset={asset}/>{preferences.wallpaper === asset.id && <Check size={17}/>}</span><strong>{asset.name}</strong></button>)}</div><p>Mais fundos, avatares, banners e molduras na aba Coleção Aero do estúdio de personalização.</p></div>}
          {!["/agenda-aluno", "/personalizacao"].includes(item.app.href) && <div className="osAppDetails"><span><Check size={16}/><strong>Pronto para abrir</strong></span><p>Acesse o módulo com sua conta SIFCAS. Seus dados e suas ações continuam no mesmo lugar.</p><small>Seus favoritos aparecem na área de trabalho.</small></div>}
          <div className="osWindowActions"><Link className="button primary" href={item.app.href}>Abrir aplicativo <ArrowUpRight size={16}/></Link><button type="button" className="osFavoriteButton" onClick={() => toggleFavorite(item.app)} aria-pressed={preferences.favorites.includes(item.app.href)}><Star size={16} fill={preferences.favorites.includes(item.app.href) ? "currentColor" : "none"}/>{preferences.favorites.includes(item.app.href) ? "Nos favoritos" : "Favoritar"}</button></div></>}
      </div>
      {!item.maximized && <button type="button" className="osWindowResize" onClick={() => activate(item.app.href)} aria-label={`Redimensionar janela ${item.app.label}. Use as setas; Shift para passos maiores.`} title="Redimensionar: arraste ou use as setas; Shift para passos maiores" onPointerDown={(event) => startDrag(event, item, true)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={(event) => {
        if (!event.key.startsWith("Arrow")) return;
        event.preventDefault();
        const step = event.shiftKey ? 50 : 10;
        changeWindow(item.app.href, resizeIFOSGeometry(item, { width: event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0, height: event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0 }, desktopViewport()));
      }}><Grip size={15}/></button>}
    </section>)}
    {startOpen && <section ref={startPanel} id="os-menu" className="osStartPanel" role="dialog" aria-modal="false" aria-label="Menu de aplicativos"><header><span className="osMenuAvatar" data-experience-avatar>{firstName.slice(0, 1)}</span><div><strong>Seu espaço, {firstName}.</strong><small>Encontre seu próximo passo.</small></div><button type="button" aria-label="Fechar menu de aplicativos" onClick={() => { setStartOpen(false); startButton.current?.focus(); }}><X size={18}/></button></header><label className="osSearch"><Search size={18}/><input ref={searchInput} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && filteredModules[0]) openApp(filteredModules[0]); }} placeholder="Buscar aplicativos, serviços, estudos…" aria-label="Buscar aplicativos"/><kbd>Esc</kbd></label><div className="osMenuCategories" aria-label="Filtrar aplicativos">{groups.map((label) => <button type="button" key={label} aria-pressed={group === label} onClick={() => setGroup(label)}>{label}</button>)}</div><div className="osAppResults"><p className="osLabel">{search ? `${filteredModules.length} RESULTADOS` : "SEUS APLICATIVOS"}</p><div className="osStartApps">{filteredModules.map((app, index) => <button type="button" key={app.href} onClick={() => openApp(app)}><span className={`osSmallTile ${appColors[index % appColors.length]}`}><ModuleIcon name={app.icon} size={20}/></span><span><strong>{app.label}</strong><small>{app.description}</small></span><ChevronRight size={15}/></button>)}</div>{!filteredModules.length && <div className="osSearchEmpty"><Search size={27}/><strong>Nenhum aplicativo encontrado</strong><p>Tente outra palavra ou categoria.</p><button type="button" onClick={() => { setSearch(""); setGroup("Todos"); }}>Mostrar todos os apps</button></div>}</div><footer><span><span className="osLiveDot"/>{availableModules.length} aplicativos disponíveis</span><Link href="/">Voltar ao SIFCAS <ArrowUpRight size={13}/></Link></footer></section>}
    <div className="osDesktopBottom"><span><Leaf size={12}/> Feito para florescer.</span><small>Interface experimental do SIFCAS · Projeto independente</small><span>AERO / {preferences.iconStyle === "pixel" ? "PIXEL" : "CAMPUS"}</span></div>
    <footer className="osTaskbar"><button ref={startButton} type="button" className={`osStartButton ${startOpen ? "isOpen" : ""}`} onClick={() => setStartOpen((value) => !value)} aria-expanded={startOpen} aria-controls="os-menu" aria-label="Abrir menu de aplicativos"><span><Leaf size={22}/></span><strong>Início</strong></button><button type="button" className="osTaskSearch" aria-label="Buscar no IFOS" onClick={() => setStartOpen(true)}><Search size={18}/></button><span className="osTaskDivider"/><div className="osTaskApps">{windows.map((item) => <button type="button" key={item.app.href} className={item.app.href === activeHref ? "isActive" : ""} aria-label={`${item.minimized || showDesktop ? "Restaurar" : "Selecionar"} janela ${item.app.label}`} aria-pressed={item.app.href === activeHref} onClick={() => { if (activeHref === item.app.href) changeWindow(item.app.href, { minimized: true }); else activate(item.app.href); }} title={item.app.label}><ModuleIcon name={item.app.icon} size={21}/><span>{item.app.label}</span><i/></button>)}</div><div className="osSystemTray">{settingsApp && <button type="button" aria-label="Preferências do IFOS" title="Personalizar" onClick={() => openApp(settingsApp)}><Settings2 size={18}/></button>}<span className="osTrayClock"><b>{clock.time}</b><small>{clock.date}</small></span><button type="button" className="osShowDesktop" onClick={() => setShowDesktop((value) => !value)} aria-label={showDesktop ? "Restaurar janelas" : "Mostrar área de trabalho"} aria-pressed={showDesktop}><Monitor size={16}/></button></div></footer>
    {error && <div className="osError" role="status"><p>{error}</p><button type="button" aria-label="Fechar aviso" onClick={() => setError("")}><X size={16}/></button></div>}
    {storageError && !storageNoticeDismissed && <div className="osStorageNotice" role="status"><p>{storageError}</p><button type="button" aria-label="Fechar aviso sobre armazenamento de janelas" onClick={() => setStorageNoticeDismissed(true)}><X size={16}/></button></div>}
    <PixelBurst trigger={burst} enabled={preferences.animations} className="osPixelBurst"/>
  </main>;
}
