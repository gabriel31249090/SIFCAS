import { aeroSpriteStyle, findAeroAsset, parseAeroAsset } from "./aero-assets.ts";

export const experienceStorageKey = "sifcas:student-experience:v1";

export type StudentExperience = {
  theme: "system" | "light" | "dark";
  palette: "aqua" | "meadow" | "sunset" | "bubblegum";
  textSize: "normal" | "large" | "xlarge";
  density: "comfortable" | "compact";
  wallpaper: "sky" | "water" | "meadow" | "aurora" | "photo-sky" | "photo-lake" | `asset-${string}`;
  profilePhoto: string | null;
  profileAvatar: string;
  profileBannerArt: string;
  profileFrameArt: string;
  buttonSkin: string;
  desktopSticker: string;
  profileFrame: "none" | "aqua" | "gold" | "pixel";
  profileBanner: "none" | "aurora" | "bubbles" | "leaves" | "pixel";
  iconStyle: "glossy" | "flat" | "pixel";
  widgets: string[];
  hiddenNavigation: string[];
  navigationOrder: string[];
  favorites: string[];
  subjectColors: Record<string, string>;
  calendarView: "agenda" | "week" | "month";
  reminders: { enabled: boolean; minutes: number; categories: string[] };
  dailySummary: { enabled: boolean; time: string; agenda: boolean; notices: boolean; tasks: boolean };
  greeting: string;
  displayName: string;
  studyGoalMinutes: number;
  focusMinutes: number;
  focusDate: string;
  focusSessions: number;
  focusDuration: number;
  soundEffects: boolean;
  animations: boolean;
};

export const defaultStudentExperience: StudentExperience = {
  theme: "system",
  palette: "aqua",
  textSize: "normal",
  density: "comfortable",
  wallpaper: "sky",
  profilePhoto: null,
  profileAvatar: "none",
  profileBannerArt: "none",
  profileFrameArt: "none",
  buttonSkin: "none",
  desktopSticker: "none",
  profileFrame: "none",
  profileBanner: "aurora",
  iconStyle: "glossy",
  widgets: ["metrics", "quick-links", "agenda", "attention", "sources"],
  hiddenNavigation: [],
  navigationOrder: [],
  favorites: ["/boletim", "/agenda-aluno", "/disciplinas", "/documentos-academicos", "/solicitacoes", "/editais"],
  subjectColors: {},
  calendarView: "agenda",
  reminders: { enabled: false, minutes: 30, categories: ["assessment", "task"] },
  dailySummary: { enabled: false, time: "07:00", agenda: true, notices: true, tasks: true },
  greeting: "Olá",
  displayName: "",
  studyGoalMinutes: 120,
  focusMinutes: 0,
  focusDate: "",
  focusSessions: 0,
  focusDuration: 25,
  soundEffects: false,
  animations: true,
};

export const experiencePresets: Record<string, Partial<StudentExperience>> = {
  "Aqua clássica": { palette: "aqua", theme: "light", wallpaper: "sky", iconStyle: "glossy", density: "comfortable" },
  "Jardim calmo": { palette: "meadow", theme: "system", wallpaper: "meadow", iconStyle: "flat", animations: false },
  "Pixel campus": { palette: "bubblegum", wallpaper: "aurora", profileFrame: "pixel", profileBanner: "pixel", iconStyle: "pixel" },
  "Foco minimalista": { palette: "aqua", theme: "light", wallpaper: "water", density: "compact", iconStyle: "flat", animations: false },
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === "string" && item.length <= 200);
const enumValue = <T extends string>(value: unknown, values: readonly T[], fallback: T): T =>
  typeof value === "string" && values.includes(value as T) ? value as T : fallback;
const booleanValue = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
const unique = (values: string[]) => [...new Set(values)];
const internalPaths = (value: unknown, fallback: string[] = []) => isStringArray(value)
  ? unique(value.filter((path) => /^\/[a-z0-9]+(?:[-/][a-z0-9]+)*\/?$/i.test(path) || path === "/"))
  : [...fallback];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Imports are stricter than loading an older local preference record. */
export function importStudentExperience(value: unknown): StudentExperience {
  if (!isRecord(value) || !Object.keys(defaultStudentExperience).some((key) => Object.hasOwn(value, key))) {
    throw new Error("Escolha um arquivo de preferências exportado pelo SIFCAS.");
  }
  return parseStudentExperience(value);
}

export function parseStudentExperience(value: unknown): StudentExperience {
  const raw = (isRecord(value) ? value : {}) as Partial<StudentExperience>;
  const validWidgetIds = ["metrics", "quick-links", "agenda", "attention", "sources"];
  const rawReminders = isRecord(raw.reminders) ? raw.reminders : defaultStudentExperience.reminders;
  const rawSummary = isRecord(raw.dailySummary) ? raw.dailySummary : defaultStudentExperience.dailySummary;
  const reminderMinutes = Number(rawReminders.minutes);
  return {
    theme: enumValue(raw.theme, ["system", "light", "dark"], defaultStudentExperience.theme),
    palette: enumValue(raw.palette, ["aqua", "meadow", "sunset", "bubblegum"], defaultStudentExperience.palette),
    textSize: enumValue(raw.textSize, ["normal", "large", "xlarge"], defaultStudentExperience.textSize),
    density: enumValue(raw.density, ["comfortable", "compact"], defaultStudentExperience.density),
    wallpaper: findAeroAsset(raw.wallpaper, "wallpaper") ? raw.wallpaper! : enumValue(raw.wallpaper, ["sky", "water", "meadow", "aurora", "photo-sky", "photo-lake"], defaultStudentExperience.wallpaper),
    profileAvatar: parseAeroAsset(raw.profileAvatar, "avatar"),
    profileBannerArt: parseAeroAsset(raw.profileBannerArt, "banner"),
    profileFrameArt: parseAeroAsset(raw.profileFrameArt, "frame"),
    buttonSkin: parseAeroAsset(raw.buttonSkin, "button"),
    desktopSticker: parseAeroAsset(raw.desktopSticker, "sticker"),
    profileFrame: enumValue(raw.profileFrame, ["none", "aqua", "gold", "pixel"], defaultStudentExperience.profileFrame),
    profileBanner: enumValue(raw.profileBanner, ["none", "aurora", "bubbles", "leaves", "pixel"], defaultStudentExperience.profileBanner),
    iconStyle: enumValue(raw.iconStyle, ["glossy", "flat", "pixel"], defaultStudentExperience.iconStyle),
    calendarView: enumValue(raw.calendarView, ["agenda", "week", "month"], defaultStudentExperience.calendarView),
    widgets: isStringArray(raw.widgets) ? unique(raw.widgets.filter((item) => validWidgetIds.includes(item))) : [...defaultStudentExperience.widgets],
    hiddenNavigation: internalPaths(raw.hiddenNavigation).filter((path) => path !== "/personalizacao"),
    navigationOrder: internalPaths(raw.navigationOrder),
    favorites: internalPaths(raw.favorites, defaultStudentExperience.favorites),
    subjectColors: raw.subjectColors && typeof raw.subjectColors === "object" && !Array.isArray(raw.subjectColors)
      ? Object.fromEntries(Object.entries(raw.subjectColors).filter(([key, color]) => key.length > 0 && key.length <= 100 && typeof color === "string" && ["aqua", "leaf", "sunset", "violet", "blue", "rose"].includes(color)).slice(0, 40))
      : {},
    reminders: {
      enabled: booleanValue(rawReminders.enabled, defaultStudentExperience.reminders.enabled),
      minutes: [10, 30, 60, 1440].includes(reminderMinutes) ? reminderMinutes : 30,
      categories: isStringArray(rawReminders.categories) ? unique(rawReminders.categories.filter((item) => ["assessment", "task", "notice"].includes(item))) : [...defaultStudentExperience.reminders.categories],
    },
    dailySummary: {
      enabled: booleanValue(rawSummary.enabled, defaultStudentExperience.dailySummary.enabled),
      time: typeof rawSummary.time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(rawSummary.time) ? rawSummary.time : defaultStudentExperience.dailySummary.time,
      agenda: booleanValue(rawSummary.agenda, defaultStudentExperience.dailySummary.agenda),
      notices: booleanValue(rawSummary.notices, defaultStudentExperience.dailySummary.notices),
      tasks: booleanValue(rawSummary.tasks, defaultStudentExperience.dailySummary.tasks),
    },
    studyGoalMinutes: boundedNumber(raw.studyGoalMinutes, 120, 10, 1440),
    focusMinutes: boundedNumber(raw.focusMinutes, 0, 0, 10000000),
    focusDate: typeof raw.focusDate === "string" && isCalendarDate(raw.focusDate) ? raw.focusDate : "",
    focusDuration: boundedNumber(raw.focusDuration, 25, 1, 120),
    focusSessions: boundedNumber(raw.focusSessions, 0, 0, 100000),
    displayName: typeof raw.displayName === "string" ? raw.displayName.slice(0, 40) : "",
    profilePhoto: typeof raw.profilePhoto === "string" && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.profilePhoto) && raw.profilePhoto.length <= 700_000 ? raw.profilePhoto : null,
    greeting: ["Olá", "Bom dia", "Boa tarde", "Boa noite", "E aí"].includes(raw.greeting ?? "") ? raw.greeting! : "Olá",
    soundEffects: booleanValue(raw.soundEffects, defaultStudentExperience.soundEffects),
    animations: booleanValue(raw.animations, defaultStudentExperience.animations),
  };
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export function experienceCss(preferences: StudentExperience) {
  const wallpaperUrls: Record<string, string> = {
    sky: "linear-gradient(145deg,#bcecff,#eefaff 52%,#dff4e3)",
    water: "linear-gradient(145deg,#83d8f2,#c7f1f3 50%,#b1dff2)",
    meadow: "linear-gradient(145deg,#c8ebae,#eff9dd 48%,#b7dfbc)",
    aurora: "linear-gradient(145deg,#b9c9f8,#d5f2ee 48%,#c2e9db)",
    "photo-sky": 'linear-gradient(#16476055,#16476055),url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=85")',
    "photo-lake": 'linear-gradient(#16476055,#16476055),url("https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2000&q=85")',
  };
  return { wallpaper: wallpaperUrls[preferences.wallpaper] ?? wallpaperUrls.sky, palette: preferences.palette, theme: preferences.theme, textSize: preferences.textSize, density: preferences.density, iconStyle: preferences.iconStyle, profileFrame: preferences.profileFrame, profileBanner: preferences.profileBanner, animations: String(preferences.animations) };
}


export function experienceAvatarStyle(preferences: StudentExperience) {
  const avatar = findAeroAsset(preferences.profileAvatar, "avatar");
  if (preferences.profilePhoto) return { backgroundImage: `url("${preferences.profilePhoto}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" as const, color: "transparent" };
  if (avatar) return { ...aeroSpriteStyle(avatar, true), color: "transparent" };
  return { backgroundImage: "", backgroundSize: "", backgroundPosition: "", backgroundRepeat: "" as const, color: "" };
}
