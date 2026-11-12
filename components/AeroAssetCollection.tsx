"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Image as ImageIcon, Monitor, MousePointer2, PanelTop, RotateCcw, Sparkles, Square, UserRound } from "lucide-react";
import { aeroAvatars, aeroBanners, aeroButtons, aeroFrames, aeroStickers, aeroWallpapers, findAeroAsset, type AeroAsset, type AeroAssetKind } from "@/lib/aero-assets";
import type { StudentExperience } from "@/lib/student-experience";
import { useStudentExperience } from "./StudentExperienceProvider";
import { AeroArtwork } from "./AeroArtwork";

const categories = [
  { id: "wallpaper", label: "Cenários", singular: "Cenário", icon: Monitor, assets: aeroWallpapers, description: "Céus azuis, cidades de vidro e um pouco de energia Y2K.", reset: "Usar cenário padrão" },
  { id: "avatar", label: "Avatares", singular: "Avatar", icon: UserRound, assets: aeroAvatars, description: "Um novo rosto para seu espaço. Escolher um avatar substitui a foto local.", reset: "Usar minhas iniciais" },
  { id: "banner", label: "Faixas", singular: "Faixa", icon: PanelTop, assets: aeroBanners, description: "Uma pequena paisagem para o seu perfil e sua prévia.", reset: "Usar faixa padrão" },
  { id: "frame", label: "Molduras", singular: "Moldura", icon: Square, assets: aeroFrames, description: "Vidro, bolhas e flores para emoldurar o seu perfil.", reset: "Sem moldura artística" },
  { id: "button", label: "Botões", singular: "Botão", icon: MousePointer2, assets: aeroButtons, description: "Um acabamento brilhante para as ações principais do site.", reset: "Usar botões padrão" },
  { id: "sticker", label: "Adesivos", singular: "Adesivo", icon: Sparkles, assets: aeroStickers, description: "Um detalhe só seu para a área de trabalho IFOS.", reset: "Sem adesivo" },
] as const;

function preferenceValue(preferences: StudentExperience, kind: AeroAssetKind) {
  switch (kind) {
    case "wallpaper": return preferences.wallpaper;
    case "avatar": return preferences.profileAvatar;
    case "banner": return preferences.profileBannerArt;
    case "frame": return preferences.profileFrameArt;
    case "button": return preferences.buttonSkin;
    case "sticker": return preferences.desktopSticker;
  }
}

export function AeroAssetCollection() {
  const { preferences, update } = useStudentExperience();
  const [activeKind, setActiveKind] = useState<AeroAssetKind>("wallpaper");
  const [notice, setNotice] = useState("");
  const category = categories.find(({ id }) => id === activeKind) ?? categories[0];
  const value = preferenceValue(preferences, activeKind);
  const selected = findAeroAsset(value, activeKind);

  function choose(asset: AeroAsset | null) {
    const id = asset?.id ?? "none";
    switch (activeKind) {
      case "wallpaper": update({ wallpaper: (asset?.id ?? "sky") as StudentExperience["wallpaper"] }); break;
      case "avatar": update({ profileAvatar: id, profilePhoto: null }); break;
      case "banner": update({ profileBannerArt: id }); break;
      case "frame": update({ profileFrameArt: id }); break;
      case "button": update({ buttonSkin: id }); break;
      case "sticker": update({ desktopSticker: id }); break;
    }
    setNotice(asset ? `${category.singular} “${asset.name}” aplicado.` : `${category.reset}.`);
  }

  function changeCategory(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % categories.length
      : event.key === "ArrowLeft" ? (index + categories.length - 1) % categories.length
        : event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActiveKind(categories[next].id); setNotice("");
    document.getElementById(`aero-category-${categories[next].id}`)?.focus();
  }

  return <section className="studioSection aeroCollection">
    <header className="aeroCollectionHero">
      <div><span className="aeroCollectionEyebrow"><Sparkles size={13}/> PEQUENAS COISAS, MUITA PERSONALIDADE</span><h2>Seu universo Aero<span>.</span></h2><p>Um céu novo. Um brilho diferente.<br/>Combine os detalhes e encontre o seu estilo.</p><span className="aeroCollectionCount"><ImageIcon size={13}/> 100 artes para explorar</span></div>
      <div className="aeroCollectionOrb" aria-hidden="true"><Sparkles size={35}/><span/><i/></div>
    </header>
    <nav className="aeroCollectionTabs" role="tablist" aria-label="Categorias da coleção Aero">{categories.map(({ id, label, icon: Icon, assets }, index) => <button type="button" role="tab" id={`aero-category-${id}`} aria-label={label} aria-controls={`aero-gallery-${id}`} aria-selected={activeKind === id} tabIndex={activeKind === id ? 0 : -1} onClick={() => { setActiveKind(id); setNotice(""); }} onKeyDown={(event) => changeCategory(event, index)} key={id}><Icon size={16}/><span>{label}</span><small aria-hidden="true">{assets.length}</small></button>)}</nav>
    <div role="tabpanel" id={`aero-gallery-${activeKind}`} aria-labelledby={`aero-category-${activeKind}`} className="aeroCollectionPanel">
      <div className="aeroCollectionHeading"><div><span className="aeroCollectionKicker">{category.assets.length} OPÇÕES · SUA COLEÇÃO</span><h3>{category.label}</h3><p>{category.description}</p></div><button className="aeroCollectionReset" type="button" aria-pressed={!selected && !(activeKind === "avatar" && preferences.profilePhoto)} onClick={() => choose(null)}><RotateCcw size={13}/>{category.reset}</button></div>
      <div className={`aeroAssetGrid aeroAssetGrid-${activeKind}`}>{category.assets.map((asset) => <button type="button" className="aeroAssetCard" data-kind={asset.kind} aria-label={`${category.singular} ${asset.name} ${asset.collection}`} aria-pressed={value === asset.id && !(activeKind === "avatar" && preferences.profilePhoto)} onClick={() => choose(asset)} key={asset.id}><span className="aeroAssetThumb"><AeroArtwork asset={asset} thumbnail/>{value === asset.id && !(activeKind === "avatar" && preferences.profilePhoto) && <span className="aeroAssetSelected"><Check size={14}/></span>}</span><span className="aeroAssetCaption"><strong>{asset.name}</strong>{" "}<small>{asset.collection}</small></span></button>)}</div>
      <p className="aeroCollectionStatus" role="status">{notice || (selected ? `Sua escolha: ${selected.name}.` : "Escolha uma arte para ver o resultado na hora.")}</p>
    </div>
    <p className="aeroCollectionFootnote"><Check size={13}/> Artes locais, sem serviços externos. Suas escolhas ficam salvas neste navegador.</p>
  </section>;
}
