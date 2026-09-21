"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { AppRole } from "@/lib/auth";
import { getAccessibleModules, moduleGroups } from "@/lib/module-catalog";
import { matchesSearch } from "@/lib/search-utils";
import { ModuleIcon } from "./ModuleIcon";
export function ModuleDirectory({ role }: { role: AppRole | null }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const modules = getAccessibleModules(role);
  const groups = moduleGroups.filter((name) => modules.some((item) => item.group === name));
  const results = modules.filter((item) => (group === "Todos" || item.group === group) && matchesSearch(item.label + " " + item.description + " " + (item.keywords ?? ""), query));
  return <>
    <div className="directoryToolbar">
      <label className="directorySearch"><Search size={21} aria-hidden="true" /><span className="srOnly">Filtrar aplicativos</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Encontre um aplicativo ou serviço…" maxLength={100} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar filtro"><X size={18} /></button>}</label>
      <span className="directoryCount" role="status">{results.length} aplicativos</span>
    </div>
    <div className="categoryFilters" aria-label="Categorias de aplicativos"><SlidersHorizontal size={17} aria-hidden="true" />{["Todos", ...groups].map((name) => <button type="button" key={name} aria-pressed={group === name} className={group === name ? "active" : ""} onClick={() => setGroup(name)}>{name}</button>)}</div>
    {results.length ? <div className="appDirectory">{results.map((item) => <Link key={item.href} href={item.href} className="directoryModule" data-group={item.group}>
      <div className="directoryModuleTop"><span className="moduleIconTile"><ModuleIcon name={item.icon} size={25} /></span><ArrowUpRight className="moduleArrow" size={20} aria-hidden="true" /></div>
      <h2>{item.label}</h2><p>{item.description}</p><small>{item.group}{item.public ? " · Público" : ""}</small>
    </Link>)}</div> : <div className="card emptyState"><Search size={30} /><h2>Nenhum aplicativo encontrado</h2><p>Tente outro termo ou escolha uma categoria diferente.</p><button type="button" className="button primary" onClick={() => { setQuery(""); setGroup("Todos"); }}>Limpar filtros</button></div>}
  </>;
}
