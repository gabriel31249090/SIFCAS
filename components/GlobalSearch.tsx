"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <form className="globalSearch" action="/buscar" method="get" role="search">
    <button className="searchSubmit" type="submit" aria-label="Executar busca"><Search size={18}/></button>
    <input ref={inputRef} name="q" aria-label="Busca global" placeholder="Buscar serviços, documentos, editais, notícias..." autoComplete="off"/>
    <kbd>Ctrl K</kbd>
  </form>;
}
