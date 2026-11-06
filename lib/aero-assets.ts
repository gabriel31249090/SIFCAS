export type AeroAssetKind = "wallpaper" | "avatar" | "banner" | "frame" | "button" | "sticker";
export type AeroAsset = {
  id: string;
  name: string;
  kind: AeroAssetKind;
  collection: "Frutiger Aero" | "Y2K" | "Vidro";
  src: string;
  width: number;
  height: number;
  crop: readonly [number, number, number, number];
};

type Sheet = { file: string; width: number; height: number };
const sheets = {
  landscapes: { file: "aero-landscapes.png", width: 1983, height: 793 },
  wallpapers: { file: "y2k-wallpapers.png", width: 1983, height: 793 },
  glass: { file: "glass-avatars.png", width: 1774, height: 887 },
  translucent: { file: "translucent-avatars.png", width: 1774, height: 887 },
  neon: { file: "neon-avatars.png", width: 1983, height: 793 },
  banners: { file: "aero-banners.png", width: 2172, height: 724 },
  retro: { file: "y2k-banners.png", width: 2172, height: 724 },
  frames: { file: "aero-frames-alpha.png", width: 1983, height: 793 },
  buttons: { file: "glossy-buttons.png", width: 1983, height: 793 },
  stickers: { file: "aero-stickers-alpha.png", width: 1983, height: 793 },
} satisfies Record<string, Sheet>;

function grid(kind: AeroAssetKind, prefix: string, sheet: Sheet, collection: AeroAsset["collection"], names: readonly string[], customCrop?: (index: number) => AeroAsset["crop"]): AeroAsset[] {
  return names.map((name, index) => {
    const cellWidth = sheet.width / 5, cellHeight = sheet.height / 2;
    const crop = customCrop?.(index) ?? [Math.round(index % 5 * cellWidth) + 5, Math.round(Math.floor(index / 5) * cellHeight) + 5, Math.floor(cellWidth) - 10, Math.floor(cellHeight) - 10] as const;
    return { id: `asset-${prefix}-${index + 1}`, name, kind, collection, src: `/assets/aero/${sheet.file}`, width: sheet.width, height: sheet.height, crop };
  });
}

export const aeroWallpapers = [
  ...grid("wallpaper", "landscape", sheets.landscapes, "Frutiger Aero", ["Cidade nas nuvens", "Aquário de vidro", "Paraíso tropical", "Céu cromado", "Cidade jardim", "Lago de lírios", "Pequeno planeta", "Mar de bolhas", "Cascata cristalina", "Arco-íris de vidro"]),
  ...grid("wallpaper", "neon", sheets.wallpapers, "Y2K", ["Laranja elétrico", "Estrelas cromadas", "Lima urbana", "Pink e ciano", "Energia azul", "Órbita violeta", "Ondas turquesa", "Estrela rubi", "Céu pop", "Ritmo laranja"]),
];

export const aeroAvatars = [
  ...grid("avatar", "glass", sheets.glass, "Frutiger Aero", ["Céu azul", "Água viva", "Folhas verdes", "Pôr do sol", "Espaço violeta", "Flor de cerejeira", "Prata urbana", "Estrelas lima", "Sonho lavanda", "Golfinho azul"], (i) => [Math.round(i % 5 * 354.8) + 5, Math.floor(i / 5) * 422 + 25, 344, 412]),
  ...grid("avatar", "translucent", sheets.translucent, "Vidro", ["Mar transparente", "Verde orvalho", "Estrela dourada", "Sol de vidro", "Órbita lilás", "Corações rosa", "Água turquesa", "Blocos azuis", "Globo de prata", "Rubi brilhante"]),
  ...grid("avatar", "pop", sheets.neon, "Y2K", ["Pop laranja", "Prata e azul", "Pink orbital", "Lima neon", "Violeta pop", "Rubi pop", "Ciano pop", "Azul elétrico", "Prata e lima", "Laranja e azul"]),
];

export const aeroBanners = [
  ...grid("banner", "banner", sheets.banners, "Frutiger Aero", ["Lago azul", "Janela no jardim", "Nosso planeta", "Cidade na água", "Cristais do mar", "Árvore ao sol", "Ondas e bolhas", "Cidade serena", "Janelas no campo", "Horizonte do planeta"]),
  ...grid("banner", "retro", sheets.retro, "Y2K", ["Som laranja", "Estrelas ciano", "Som lima", "Fones pink", "Cromo azul", "Batida violeta", "Estrelas douradas", "Cidade pink", "Rede turquesa", "Vinil preto"], (i) => [Math.round(i % 5 * 434.4) + 10, i < 5 ? 80 : 375, 418, i < 5 ? 256 : 246]),
];

export const aeroFrames = grid("frame", "frame", sheets.frames, "Frutiger Aero", ["Bolhas tropicais", "Estrelas de prata", "Vidro lima", "Pop laranja", "Corações pink", "Flores violetas", "Cromo holográfico", "Mundo digital", "Água cristalina", "Jardim de lírios"]);
export const aeroButtons = grid("button", "button", sheets.buttons, "Y2K", ["Aqua brilhante", "Cromo azul", "Lima brilhante", "Holográfico", "Estrela laranja", "Pink brilhante", "Violeta brilhante", "Turquesa brilhante", "Folha verde", "Órbita azul"], (i) => [Math.round(i % 5 * 396.6) + 13, i < 5 ? 136 : 518, 372, i < 5 ? 166 : 174]);
export const aeroStickers = grid("sticker", "sticker", sheets.stickers, "Frutiger Aero", ["Bolhas de céu", "Nota musical", "Estrela de cristal", "Planeta verde", "Alto-falante", "Gota de água", "Borboleta holográfica", "Janela de vidro", "Folha com orvalho", "Estrela orbital"]);
export const aeroAssets: readonly AeroAsset[] = [...aeroWallpapers, ...aeroAvatars, ...aeroBanners, ...aeroFrames, ...aeroButtons, ...aeroStickers];

export function findAeroAsset(id: string | undefined, kind?: AeroAssetKind) {
  return aeroAssets.find((asset) => asset.id === id && (!kind || asset.kind === kind));
}

export function parseAeroAsset(value: unknown, kind: AeroAssetKind): string {
  return typeof value === "string" && findAeroAsset(value, kind) ? value : "none";
}

/** Background coordinates are derived only from the local catalog, never imported URLs. */
export function aeroSpriteStyle(asset: AeroAsset, square = false) {
  let [x, y, width, height] = asset.crop;
  if (square) {
    const size = Math.min(width, height);
    x += (width - size) / 2; y += (height - size) / 2; width = size; height = size;
  }
  return {
    backgroundImage: `url("${asset.src}")`,
    backgroundSize: `${asset.width / width * 100}% ${asset.height / height * 100}%`,
    backgroundPosition: `${x / (asset.width - width) * 100}% ${y / (asset.height - height) * 100}%`,
    backgroundRepeat: "no-repeat" as const,
  };
}
