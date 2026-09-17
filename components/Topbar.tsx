import { Bell, Search, Grid2X2 } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <label className="globalSearch">
        <Search size={18}/><input aria-label="Busca global" placeholder="Buscar serviços, documentos, cursos, pessoas..."/>
        <kbd>Ctrl K</kbd>
      </label>
      <div className="topActions">
        <button aria-label="Aplicativos"><Grid2X2 size={18}/></button>
        <button aria-label="Notificações"><Bell size={18}/></button>
        <div className="userChip"><span className="avatar">GE</span><span><strong>Gabriel</strong><small>Estudante</small></span></div>
      </div>
    </header>
  );
}
