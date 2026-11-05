"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Bell, BookOpen, Check, CheckCheck, ChevronRight, Clock3, Download, HardDrive, ImagePlus, LayoutDashboard, Leaf, Monitor, Moon, Palette, RotateCcw, ShieldCheck, Sparkles, Sun, Timer, Upload, UserRound, Volume2 } from "lucide-react";
import { defaultStudentExperience, experienceCss, experiencePresets, importStudentExperience, type StudentExperience } from "@/lib/student-experience";
import { getAccessibleModules } from "@/lib/module-catalog";
import { useStudentExperience } from "./StudentExperienceProvider";
import { FocusTools } from "./FocusTimer";
import { PixelBurst } from "./PixelBurst";

const widgetNames: Record<string, string> = { metrics: "Resumo do campus", "quick-links": "Meus atalhos", agenda: "Agenda, LUMA e importação", attention: "Pontos de atenção", sources: "Fontes e atualizações" };
const studentModules = getAccessibleModules("student").filter((item) => item.href !== "/ifos");
const navigationItems = studentModules.filter((item) => item.navigation).map(({ href, label, group }) => ({ href, label, group }));
const favoriteItems = studentModules.map(({ href, label }) => ({ href, label }));
const subjects = ["Matemática", "Português", "Biologia", "História", "Química", "Física", "Informática"];
const toneNames: Record<string, string> = { aqua: "Aqua", leaf: "Verde", sunset: "Dourado", violet: "Violeta", blue: "Azul", rose: "Rosa" };
const frameNames = { none: "Sem moldura", aqua: "Aqua", gold: "Dourada", pixel: "Pixel" };
const bannerNames = { none: "Sem faixa", aurora: "Aurora", bubbles: "Bolhas", leaves: "Folhas", pixel: "Pixel" };
const wallpapers: { id: StudentExperience["wallpaper"]; name: string; detail: string }[] = [
  { id: "sky", name: "Céu Aero", detail: "Leve e luminoso" }, { id: "water", name: "Água cristalina", detail: "Um respiro azul" },
  { id: "meadow", name: "Jardim", detail: "Natureza por perto" }, { id: "aurora", name: "Aurora", detail: "Cores em harmonia" },
  { id: "photo-sky", name: "Horizonte", detail: "Foto · Unsplash" }, { id: "photo-lake", name: "Lago sereno", detail: "Foto · Unsplash" },
];
const tabs = [{ id: "appearance", label: "Aparência", icon: Palette }, { id: "profile", label: "Seu perfil", icon: UserRound }, { id: "navigation", label: "Início e atalhos", icon: LayoutDashboard }, { id: "routine", label: "Rotina e foco", icon: Timer }, { id: "data", label: "Seus dados", icon: HardDrive }] as const;
type StudioTab = typeof tabs[number]["id"];
const presetDescriptions = ["Vidro, céu azul e um toque de nostalgia.", "Verde suave para estudar com calma.", "Pequenos pixels. Muita personalidade.", "Mais espaço para o que importa."];

function moveItem(items: string[], item: string, offset: number) {
  const index = items.indexOf(item), nextIndex = index + offset;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; return next;
}
function StudioSection({ title, description, children, icon }: { title: string; description?: string; children: ReactNode; icon?: ReactNode }) {
  return <section className="studioSection"><div className="studioSectionHeading">{icon && <span>{icon}</span>}<div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{children}</section>;
}
function LivePreview({ preferences, burst }: { preferences: StudentExperience; burst: number }) {
  return <aside className="studioPreview"><div className="studioPreviewLabel"><span><span className="studioLiveDot"/> PRÉVIA AO VIVO</span><Monitor size={15}/></div><div className="studioPreviewScreen" style={{ backgroundImage: experienceCss(preferences).wallpaper }} data-pixel={preferences.iconStyle === "pixel"} data-icons={preferences.iconStyle}><div className="studioMockToolbar"><span className="studioMockDots"><i/><i/><i/></span><span>meu SIFCAS</span><Sparkles size={11}/></div><div className="studioMockWindow"><div className="studioMockBanner" data-banner={preferences.profileBanner}/><div className="studioMockAvatar" data-frame={preferences.profileFrame} style={preferences.profilePhoto ? { backgroundImage: `url("${preferences.profilePhoto}")` } : undefined}>{!preferences.profilePhoto && <UserRound size={25}/>}</div><div className="studioMockWelcome"><small>SEU ESPAÇO NO CAMPUS</small><strong>{preferences.greeting}, {preferences.displayName || "estudante"}!</strong><span>Um novo dia, novas possibilidades.</span></div><div className="studioMockTiles"><div><span><BookOpen size={18}/></span><small>Meus estudos</small></div><div><span><Clock3 size={18}/></span><small>Minha agenda</small></div><div><span><Leaf size={18}/></span><small>Meu foco</small></div></div><div className="studioMockNote"><CheckCheck size={17}/><div><strong>Tudo em seu lugar</strong><small>Seu campus, com a sua personalidade.</small></div></div></div><div className="studioMockDock"><span><Leaf size={15}/></span><span><BookOpen size={14}/></span><span><Palette size={14}/></span><i/><small>IFOS</small></div><PixelBurst trigger={burst} enabled={preferences.animations} className="studioPreviewBurst"/></div><div className="studioPreviewCaption"><Sparkles size={15}/><p>Os detalhes mudam com você.<br/><strong>Experimente e veja na hora.</strong></p></div><div className="studioPreviewSummary"><span><i data-tone={preferences.palette}/>{({ aqua: "Aqua", meadow: "Jardim", sunset: "Pôr do sol", bubblegum: "Bubblegum" })[preferences.palette]}</span><span>{preferences.theme === "dark" ? <Moon size={12}/> : <Sun size={12}/>} {preferences.theme === "system" ? "Automático" : preferences.theme === "dark" ? "Escuro" : "Claro"}</span></div><Link className="studioDesktopLink" href="/ifos"><Monitor size={18}/><div><strong>Conheça seu IFOS</strong><small>Seu campus em uma área de trabalho.</small></div><ArrowRight size={16}/></Link><p className="studioPreviewFootnote"><ShieldCheck size={13}/> Suas escolhas ficam neste navegador.</p></aside>;
}

export function StudentExperienceSettings() {
  const { preferences, ready, storageError, update } = useStudentExperience();
  const [activeTab, setActiveTab] = useState<StudioTab>("appearance");
  const [feedback, setFeedback] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [burst, setBurst] = useState(0);

  function toggleList(key: "widgets" | "favorites" | "hiddenNavigation" | "reminders.categories", value: string) {
    update((current) => {
      if (key === "reminders.categories") return { ...current, reminders: { ...current.reminders, categories: current.reminders.categories.includes(value) ? current.reminders.categories.filter((item) => item !== value) : [...current.reminders.categories, value] } };
      const list = current[key]; return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }
  function applyPreset(name: string) { update((current) => ({ ...current, ...experiencePresets[name] })); setFeedback(`Tema “${name}” aplicado.`); setBurst((value) => value + 1); }
  function saveFile() {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(preferences, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "sifcas-preferencias.json"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setFeedback("Seu arquivo de preferências foi exportado.");
    } catch { setFeedback("Não foi possível exportar o arquivo. Tente novamente."); }
  }
  async function loadFile(file?: File) {
    if (!file) return;
    if (file.size > 1024 * 1024) { setFeedback("O arquivo de preferências deve ter até 1 MB."); return; }
    try { update(importStudentExperience(JSON.parse(await file.text()))); setFeedback("Preferências importadas. Seu espaço já está atualizado."); }
    catch { setFeedback("Arquivo inválido. Escolha um JSON de preferências exportado pelo SIFCAS."); }
  }
  async function setProfilePhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 512 * 1024) { setFeedback("Use uma foto JPG, PNG ou WebP de até 512 KB."); return; }
    try {
      const photo = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Imagem inválida")); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      await new Promise<void>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(); image.onerror = () => reject(new Error("Imagem inválida")); image.src = photo; });
      update({ profilePhoto: photo }); setFeedback("Sua foto foi atualizada neste navegador.");
    } catch { setFeedback("Não foi possível abrir essa imagem. Escolha outra foto."); }
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActiveTab(tabs[next].id); document.getElementById(`studio-tab-${tabs[next].id}`)?.focus();
  }
  const navigationOrder = [...preferences.navigationOrder.filter((href) => navigationItems.some((item) => item.href === href)), ...navigationItems.map((item) => item.href).filter((href) => !preferences.navigationOrder.includes(href))];
  const navigationGroups = [...new Set(navigationItems.map((item) => item.group))].map((group) => ({ group, items: navigationOrder.filter((href) => navigationItems.some((item) => item.href === href && item.group === group)) }));
  function moveNavigation(items: string[], href: string, offset: number) {
    const reordered = moveItem(items, href, offset);
    let nextIndex = 0;
    update({ navigationOrder: navigationOrder.map((current) => items.includes(current) ? reordered[nextIndex++] : current) });
  }
  if (!ready) return <div className="studioLoading" role="status"><Sparkles size={24}/><p>Preparando seu espaço…</p></div>;

  return <div className="studentExperience personalizationStudio">
    <header className="studioHero"><div className="studioHeroCopy"><span className="studioEyebrow"><Sparkles size={13}/> SEU SIFCAS, DO SEU JEITO</span><h1>Personalização<span aria-hidden="true">.</span></h1><p>Um pouco mais de você.<br/>Em cada detalhe do seu campus.</p><span className="studioSaved"><CheckCheck size={14}/> {storageError ? "Alterações nesta sessão" : "Suas escolhas são salvas automaticamente"}</span></div><div className="studioHeroArt" aria-hidden="true"><div className="studioHeroOrb"><Leaf size={52} strokeWidth={1.5}/></div><span className="studioOrbit studioOrbitOne"/><span className="studioOrbit studioOrbitTwo"/><span className="studioPixelStar">✦</span><span className="studioHeroArtCaption">um espaço para ser você</span></div></header>
    <div className="studioNotice" role="status">{feedback && <span><Check size={16}/>{feedback}</span>}{storageError && <span className="studioStorageError"><HardDrive size={16}/>{storageError}</span>}</div>
    <nav className="studioTabs" role="tablist" aria-label="Categorias de personalização">
  {tabs.map(({ id, label, icon: Icon }, index) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={`studio-tab-${id}`}
      aria-controls={`studio-panel-${id}`}
      aria-selected={activeTab === id}
      tabIndex={activeTab === id ? 0 : -1}
      onClick={() => setActiveTab(id)}
      onKeyDown={(event) => onTabKey(event, index)}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  ))}
</nav>
    <div className="studioLayout"><div className="studioContent">
      <div role="tabpanel" id="studio-panel-appearance" aria-labelledby="studio-tab-appearance" hidden={activeTab !== "appearance"}>
        <StudioSection title="Encontre sua atmosfera" description="Comece por uma combinação pronta. Depois, deixe cada detalhe com a sua cara." icon={<Sparkles size={20}/>}>
          <div className="studioPresets">{Object.entries(experiencePresets).map(([name, preset], index) => { const active = Object.entries(preset).every(([key, value]) => preferences[key as keyof StudentExperience] === value); return <button className="studioPreset" type="button" aria-pressed={active} data-preset={index} onClick={() => applyPreset(name)} key={name}><span className="studioPresetArt"><span className="studioPresetMini"><i/><span/><span/><span/></span><i className="studioPresetSun"/>{active && <b><Check size={13}/></b>}</span><strong>{name}</strong><small>{presetDescriptions[index]}</small></button>; })}</div>
        </StudioSection>
        <StudioSection title="Cores, luz e textura" description="Escolhas que acompanham você em todo o SIFCAS." icon={<Palette size={20}/>}><div className="studioFields"><label>Paleta<select value={preferences.palette} onChange={(event) => update({ palette: event.target.value as StudentExperience["palette"] })}><option value="aqua">Aqua · azul do céu</option><option value="meadow">Jardim · verde natural</option><option value="sunset">Pôr do sol · tons quentes</option><option value="bubblegum">Bubblegum · violeta suave</option></select></label><label>Tema<select value={preferences.theme} onChange={(event) => update({ theme: event.target.value as StudentExperience["theme"] })}><option value="system">Automático (sistema)</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label><label>Tamanho de texto<select value={preferences.textSize} onChange={(event) => update({ textSize: event.target.value as StudentExperience["textSize"] })}><option value="normal">Padrão</option><option value="large">Grande</option><option value="xlarge">Extra grande</option></select></label><label>Densidade dos cartões<select value={preferences.density} onChange={(event) => update({ density: event.target.value as StudentExperience["density"] })}><option value="comfortable">Confortável · mais respiro</option><option value="compact">Compacta · mais conteúdo</option></select></label><label>Estilo dos ícones<select value={preferences.iconStyle} onChange={(event) => update({ iconStyle: event.target.value as StudentExperience["iconStyle"] })}><option value="glossy">Aero brilhante</option><option value="flat">Simples</option><option value="pixel">Pixel art</option></select></label></div><label className="studioToggle"><input type="checkbox" checked={preferences.animations} onChange={(event) => update({ animations: event.target.checked })}/><span><strong>Um toque de movimento</strong><small>Transições suaves. A preferência de movimento reduzido do sistema é respeitada.</small></span><Sparkles size={18}/></label></StudioSection>
        <StudioSection title="Uma nova vista" description="Escolha o cenário do site e da sua área de trabalho IFOS." icon={<Monitor size={20}/>}><label className="studioWallpaperSelect">Papel de parede<select value={preferences.wallpaper} onChange={(event) => update({ wallpaper: event.target.value as StudentExperience["wallpaper"] })}>{wallpapers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="studioWallpapers">{wallpapers.map(({ id, name, detail }) => <button type="button" className="studioWallpaper" data-wallpaper={id} aria-pressed={preferences.wallpaper === id} onClick={() => update({ wallpaper: id })} key={id}><span className="studioWallpaperArt" style={preferences.wallpaper === id && id.startsWith("photo-") ? { backgroundImage: experienceCss(preferences).wallpaper } : undefined}>{id.startsWith("photo-") && preferences.wallpaper !== id && <Monitor size={24}/>}<span>{preferences.wallpaper === id && <Check size={13}/>}</span></span><strong>{name}</strong><small>{detail}</small></button>)}</div><p className="studioFinePrint">As duas fotografias são carregadas da <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a> somente quando escolhidas.</p></StudioSection>
      </div>
      <div role="tabpanel" id="studio-panel-profile" aria-labelledby="studio-tab-profile" hidden={activeTab !== "profile"}>
        <StudioSection title="Prazer, você" description="Uma saudação familiar e um perfil que combina com o seu momento." icon={<UserRound size={20}/>}><div className="studioFields"><label>Saudação<select value={preferences.greeting} onChange={(event) => update({ greeting: event.target.value })}>{["Olá", "Bom dia", "Boa tarde", "Boa noite", "E aí"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Como quer ser chamado?<input maxLength={40} value={preferences.displayName} onChange={(event) => update({ displayName: event.target.value })} placeholder="Seu nome ou apelido"/></label></div><div className="studioPhotoUpload"><div className="studioPhotoPreview" style={preferences.profilePhoto ? { backgroundImage: `url("${preferences.profilePhoto}")` } : undefined}>{!preferences.profilePhoto && <UserRound size={30}/>}</div><div><strong>Sua foto de perfil</strong><p>JPG, PNG ou WebP de até 512 KB.</p><label className="button soft experienceFileButton"><ImagePlus size={14}/> Escolher foto<input aria-label="Foto de perfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void setProfilePhoto(event.target.files?.[0]); event.currentTarget.value = ""; }}/></label>{preferences.profilePhoto && <button className="studioTextButton" type="button" onClick={() => update({ profilePhoto: null })}>Remover foto</button>}</div></div></StudioSection>
        <StudioSection title="Os detalhes fazem diferença" description="Um brilho, uma moldura, uma faixa. Encontre sua combinação." icon={<Sparkles size={20}/>}><div className="studioFields"><label>Moldura do perfil<select value={preferences.profileFrame} onChange={(event) => update({ profileFrame: event.target.value as StudentExperience["profileFrame"] })}>{Object.entries(frameNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Faixa do perfil<select value={preferences.profileBanner} onChange={(event) => update({ profileBanner: event.target.value as StudentExperience["profileBanner"] })}>{Object.entries(bannerNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="studioPixelNote"><span className="studioPixelFlower" aria-hidden="true"/><p><strong>Um pequeno universo de pixels.</strong> Experimente o tema Pixel campus para combinar a moldura, os ícones e o fundo.</p><button className="studioTextButton" type="button" onClick={() => applyPreset("Pixel campus")}>Experimentar <ChevronRight size={14}/></button></div></StudioSection>
      </div>
      <div role="tabpanel" id="studio-panel-navigation" aria-labelledby="studio-tab-navigation" hidden={activeTab !== "navigation"}>
        <StudioSection title="Seu início, em ordem" description="Escolha os cartões que aparecem no início e organize a sequência." icon={<LayoutDashboard size={20}/>}><div className="studioChecks">{Object.entries(widgetNames).map(([id, label]) => <label key={id}><input type="checkbox" checked={preferences.widgets.includes(id)} onChange={() => toggleList("widgets", id)}/><span>{label}</span></label>)}</div><ol className="studioOrderList">{preferences.widgets.map((id, index) => <li key={id}><span className="studioOrderNumber">{index + 1}</span><span>{widgetNames[id]}</span><button type="button" aria-label={`Mover ${widgetNames[id]} para cima`} disabled={index === 0} onClick={() => update({ widgets: moveItem(preferences.widgets, id, -1) })}><ArrowUp size={14}/></button><button type="button" aria-label={`Mover ${widgetNames[id]} para baixo`} disabled={index === preferences.widgets.length - 1} onClick={() => update({ widgets: moveItem(preferences.widgets, id, 1) })}><ArrowDown size={14}/></button></li>)}</ol>{preferences.widgets.length === 0 && <p className="studioEmpty">Seu início ficou mais tranquilo. Selecione um cartão acima para adicioná-lo de volta.</p>}</StudioSection>
        <StudioSection title="O que você mais usa, por perto" description="Seus favoritos aparecem nos atalhos do início e no IFOS." icon={<BookOpen size={20}/>}><div className="studioChecks studioChecksCompact">{favoriteItems.map((item) => <label key={item.href}><input type="checkbox" checked={preferences.favorites.includes(item.href)} onChange={() => toggleList("favorites", item.href)}/><span>{item.label}</span></label>)}</div></StudioSection>
        <StudioSection title="Sua navegação" description="Mostre os módulos que usa e ordene cada grupo do menu. Personalização continua sempre acessível." icon={<Monitor size={20}/>}>
          {navigationGroups.map(({ group, items }) => <div className="studioNavigationGroup" key={group}><h3>{group}</h3><ol className="studioOrderList">{items.map((href, index) => {
            const label = navigationItems.find((item) => item.href === href)?.label ?? href;
            return <li key={href}><label><input type="checkbox" checked={href === "/personalizacao" || !preferences.hiddenNavigation.includes(href)} disabled={href === "/personalizacao"} onChange={() => toggleList("hiddenNavigation", href)}/><span>{label}</span></label><button type="button" aria-label={`Mover ${label} na navegação para cima`} disabled={index === 0} onClick={() => moveNavigation(items, href, -1)}><ArrowUp size={14}/></button><button type="button" aria-label={`Mover ${label} na navegação para baixo`} disabled={index === items.length - 1} onClick={() => moveNavigation(items, href, 1)}><ArrowDown size={14}/></button></li>;
          })}</ol></div>)}
        </StudioSection>
      </div>
      <div role="tabpanel" id="studio-panel-routine" aria-labelledby="studio-tab-routine" hidden={activeTab !== "routine"}>
        <FocusTools/>
        <StudioSection title="Cada matéria, uma cor" description="Dê um toque visual à sua rotina de estudos." icon={<BookOpen size={20}/>}><label>Visualização padrão da agenda<select value={preferences.calendarView} onChange={(event) => update({ calendarView: event.target.value as StudentExperience["calendarView"] })}><option value="agenda">Lista de agenda</option><option value="week">Semana</option><option value="month">Mês</option></select></label><div className="studioSubjectColors">{subjects.map((subject) => <label key={subject}><i data-tone={preferences.subjectColors[subject] ?? "default"}/><span>{subject}</span><select aria-label={`Cor de ${subject}`} value={preferences.subjectColors[subject] ?? ""} onChange={(event) => { const value = event.target.value; update((current) => { const subjectColors = { ...current.subjectColors }; if (value) subjectColors[subject] = value; else delete subjectColors[subject]; return { ...current, subjectColors }; }); }}><option value="">Padrão</option>{Object.entries(toneNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>)}</div></StudioSection>
        <StudioSection title="Som e lembretes" description="Organize suas preferências de rotina." icon={<Bell size={20}/>}><label className="studioToggle"><input type="checkbox" checked={preferences.soundEffects} onChange={(event) => update({ soundEffects: event.target.checked })}/><span><strong>Som ao concluir o foco</strong><small>Um aviso breve quando sua sessão terminar.</small></span><Volume2 size={18}/></label><details className="studioDetails"><summary>Planejar lembretes e resumo diário <span>Preferências locais</span></summary><p>Estas opções guardam seu planejamento. Lembretes e resumos ainda não são enviados automaticamente.</p><label className="studioToggle"><input type="checkbox" checked={preferences.reminders.enabled} onChange={(event) => { const enabled = event.target.checked; update((current) => ({ ...current, reminders: { ...current.reminders, enabled } })); }}/><span><strong>Planejar lembretes</strong><small>Guardar categorias e antecedência preferidas.</small></span></label><label>Antecedência<select disabled={!preferences.reminders.enabled} value={preferences.reminders.minutes} onChange={(event) => { const minutes = Number(event.target.value); update((current) => ({ ...current, reminders: { ...current.reminders, minutes } })); }}><option value="10">10 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label><div className="studioChecks">{[["assessment", "Avaliações"], ["task", "Trabalhos"], ["notice", "Avisos"]].map(([value, label]) => <label key={value}><input type="checkbox" disabled={!preferences.reminders.enabled} checked={preferences.reminders.categories.includes(value)} onChange={() => toggleList("reminders.categories", value)}/>{label}</label>)}</div><label className="studioToggle"><input type="checkbox" checked={preferences.dailySummary.enabled} onChange={(event) => { const enabled = event.target.checked; update((current) => ({ ...current, dailySummary: { ...current.dailySummary, enabled } })); }}/><span><strong>Planejar resumo do dia</strong><small>Guardar horário e conteúdo preferidos.</small></span></label><label>Horário preferido<input type="time" disabled={!preferences.dailySummary.enabled} value={preferences.dailySummary.time} onChange={(event) => { const time = event.target.value; update((current) => ({ ...current, dailySummary: { ...current.dailySummary, time } })); }}/></label><div className="studioChecks">{[["agenda", "Agenda"], ["notices", "Avisos"], ["tasks", "Tarefas e avaliações"]].map(([key, label]) => <label key={key}><input type="checkbox" disabled={!preferences.dailySummary.enabled} checked={preferences.dailySummary[key as "agenda" | "notices" | "tasks"]} onChange={(event) => { const checked = event.target.checked; update((current) => ({ ...current, dailySummary: { ...current.dailySummary, [key]: checked } })); }}/>{label}</label>)}</div></details></StudioSection>
      </div>
      <div role="tabpanel" id="studio-panel-data" aria-labelledby="studio-tab-data" hidden={activeTab !== "data"}>
        <StudioSection title="Seu espaço vai com você" description="Exporte um arquivo para levar sua personalização a outro navegador." icon={<Download size={20}/>}><div className="studioDataCard"><span><Download size={23}/></span><div><h3>Guardar suas preferências</h3><p>Temas, foto, atalhos e metas em um arquivo JSON. Os dados acadêmicos ficam fora dele.</p></div><button className="button soft" type="button" onClick={saveFile}><Download size={14}/> Exportar</button></div><div className="studioDataCard"><span><Upload size={23}/></span><div><h3>Trazer suas preferências</h3><p>Escolha um arquivo exportado pelo SIFCAS. Ele substituirá as escolhas deste navegador.</p></div><label className="button soft experienceFileButton"><Upload size={14}/> Importar<input aria-label="Importar preferências JSON" type="file" accept="application/json,.json" onChange={(event) => { void loadFile(event.target.files?.[0]); event.currentTarget.value = ""; }}/></label></div></StudioSection>
        <StudioSection title="Você tem o controle" icon={<ShieldCheck size={20}/>}><div className="studioPrivacyCard"><ShieldCheck size={25}/><div><strong>Salvo aqui, separado por conta</strong><p>Suas escolhas e sua foto ficam no armazenamento deste navegador. A sincronização entre dispositivos ainda não está disponível. Notas, frequência e outros registros acadêmicos permanecem protegidos.</p></div></div><div className="studioReset"><div><strong>Começar de novo</strong><p>Restaurar a aparência, os atalhos e as metas para o padrão.</p></div><button className="button soft" type="button" onClick={() => setResetPending(true)}><RotateCcw size={14}/> Restaurar padrão</button></div>{resetPending && <div className="studioResetConfirm"><p>Restaurar todas as suas preferências locais, incluindo foto e totais de foco?</p><div><button className="button dangerOutline" type="button" onClick={() => { update(defaultStudentExperience); setResetPending(false); setFeedback("Personalização restaurada neste navegador."); }}>Sim, restaurar</button><button className="button soft" type="button" onClick={() => setResetPending(false)}>Manter minhas escolhas</button></div></div>}</StudioSection>
      </div>
    </div><LivePreview preferences={preferences} burst={burst}/></div>
  </div>;
}
