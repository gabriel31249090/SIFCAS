"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { experienceCss, experienceStorageKey, parseStudentExperience, type StudentExperience } from "@/lib/student-experience";
import { getDefaultFavoritePaths } from "@/lib/module-catalog";
import type { AppRole } from "@/lib/auth";

type ExperienceContextValue = {
  preferences: StudentExperience;
  ready: boolean;
  storageKey: string;
  storageError: string | null;
  update: (patch: Partial<StudentExperience> | ((current: StudentExperience) => StudentExperience)) => void;
};
const ExperienceContext = createContext<ExperienceContextValue | null>(null);

type ExperienceSnapshot = {
  key: string;
  preferences: StudentExperience;
  ready: boolean;
  storageError: string | null;
};

function defaultPreferences(role: AppRole | null): StudentExperience {
  return { ...parseStudentExperience(null), favorites: getDefaultFavoritePaths(role) };
}

function readPreferences(key: string, role: AppRole | null): ExperienceSnapshot {
  try {
    const saved = window.localStorage.getItem(key);
    return { key, preferences: saved ? parseStudentExperience(JSON.parse(saved)) : defaultPreferences(role), ready: true, storageError: null };
  } catch {
    return { key, preferences: defaultPreferences(role), ready: true, storageError: "Não foi possível carregar as preferências salvas. Você pode personalizar esta aba novamente." };
  }
}

function clearExperienceStyles() {
  const root = document.documentElement;
  for (const key of ["experiencePalette", "experienceTheme", "experienceText", "experienceDensity", "experienceIcons", "experienceFrame", "experienceBanner", "experienceAnimations", "experienceResolvedTheme", "experienceCalendar"]) delete root.dataset[key];
  document.body.style.removeProperty("background-image");
  document.body.style.removeProperty("background-size");
  document.body.style.removeProperty("background-attachment");
  document.querySelectorAll<HTMLElement>("[data-experience-widget], [data-experience-href], [data-experience-favorite]").forEach((element) => { element.hidden = false; element.style.order = ""; });
  document.querySelectorAll<HTMLElement>("[data-experience-avatar]").forEach((element) => { element.style.backgroundImage = ""; element.style.color = ""; });
  document.querySelectorAll<HTMLElement>(".calendarCard").forEach((element) => { delete element.dataset.experienceCalendar; });
  document.querySelectorAll<HTMLElement>("[data-experience-subject]").forEach((element) => { delete element.dataset.experienceSubjectColor; });
}

export function StudentExperienceProvider({ children, userId, enabled, role }: { children: ReactNode; userId: string | null; enabled: boolean; role: AppRole | null }) {
  const pathname = usePathname();
  const storageKey = userId ? `${experienceStorageKey}:${userId}` : experienceStorageKey;
  const [snapshot, setSnapshot] = useState<ExperienceSnapshot>(() => ({ key: storageKey, preferences: defaultPreferences(role), ready: false, storageError: null }));
  const currentSnapshot = useRef(snapshot);
  // Never expose a previous account's preferences while loading another account.
  const { preferences, ready, storageError } = useMemo(() => snapshot.key === storageKey ? snapshot : { key: storageKey, preferences: defaultPreferences(role), ready: false, storageError: null }, [snapshot, storageKey, role]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const next = readPreferences(storageKey, role);
      currentSnapshot.current = next;
      setSnapshot(next);
    });
    const syncPreferences = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readPreferences(storageKey, role);
      currentSnapshot.current = next;
      setSnapshot(next);
    };
    window.addEventListener("storage", syncPreferences);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncPreferences);
    };
  }, [storageKey, role]);

  const update = useCallback((patch: Partial<StudentExperience> | ((current: StudentExperience) => StudentExperience)) => {
    const current = currentSnapshot.current.key === storageKey && currentSnapshot.current.ready
      ? currentSnapshot.current.preferences
      : readPreferences(storageKey, role).preferences;
    const nextPreferences = parseStudentExperience(typeof patch === "function" ? patch(current) : { ...current, ...patch });
    let error: string | null = null;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
    } catch {
      error = "Não foi possível salvar suas preferências. As alterações valem só nesta aba; libere espaço ou permita o armazenamento para mantê-las.";
    }
    const next = { key: storageKey, preferences: nextPreferences, ready: true, storageError: error };
    currentSnapshot.current = next;
    setSnapshot(next);
  }, [storageKey, role]);

  useEffect(() => {
    if (!enabled) {
      clearExperienceStyles();
      return;
    }
    if (!ready) return;
    const root = document.documentElement;
    const css = experienceCss(preferences);
    root.dataset.experiencePalette = css.palette;
    root.dataset.experienceTheme = css.theme;
    root.dataset.experienceText = css.textSize;
    root.dataset.experienceDensity = css.density;
    root.dataset.experienceIcons = css.iconStyle;
    root.dataset.experienceFrame = css.profileFrame;
    root.dataset.experienceBanner = css.profileBanner;
    root.dataset.experienceCalendar = preferences.calendarView;
    const usePhoto = preferences.wallpaper.startsWith("photo-");
    document.body.style.backgroundImage = css.wallpaper;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = usePhoto ? "fixed" : "scroll";
    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applySystemPreferences = () => {
      root.dataset.experienceResolvedTheme = preferences.theme === "system" ? themeMedia.matches ? "dark" : "light" : preferences.theme;
      root.dataset.experienceAnimations = String(preferences.animations && !motionMedia.matches);
    };
    applySystemPreferences();
    themeMedia.addEventListener("change", applySystemPreferences);
    motionMedia.addEventListener("change", applySystemPreferences);

    const applyContentPreferences = () => {
      document.querySelectorAll<HTMLElement>("[data-experience-widget]").forEach((element) => {
        element.hidden = !preferences.widgets.includes(element.dataset.experienceWidget ?? "");
        const position = preferences.widgets.indexOf(element.dataset.experienceWidget ?? "");
        element.style.order = position < 0 ? "" : String(position);
      });
      document.querySelectorAll<HTMLElement>(".calendarCard").forEach((element) => { element.dataset.experienceCalendar = preferences.calendarView; });
      document.querySelectorAll<HTMLElement>("[data-experience-href]").forEach((element) => {
        const href = element.dataset.experienceHref ?? "";
        element.hidden = preferences.hiddenNavigation.includes(href);
        const order = preferences.navigationOrder.indexOf(href);
        element.style.order = order < 0 ? "" : String(order);
      });
      document.querySelectorAll<HTMLElement>("[data-experience-favorite]").forEach((element) => {
        const href = element.dataset.experienceFavorite ?? "";
        element.hidden = !preferences.favorites.includes(href);
        const order = preferences.favorites.indexOf(href);
        element.style.order = order < 0 ? "" : String(order);
      });
      document.querySelectorAll<HTMLElement>("[data-experience-avatar]").forEach((element) => {
        element.style.backgroundImage = preferences.profilePhoto ? `url("${preferences.profilePhoto}")` : "";
        element.style.color = preferences.profilePhoto ? "transparent" : "";
      });
      document.querySelectorAll<HTMLElement>("[data-experience-subject]").forEach((element) => {
        const name = element.dataset.experienceSubject ?? "";
        const tone = preferences.subjectColors[name];
        element.dataset.experienceSubjectColor = tone ?? "";
      });
    };
    applyContentPreferences();
    // App Router can stream new page content after the pathname has changed.
    const contentSelector = "[data-experience-widget], .calendarCard, [data-experience-href], [data-experience-favorite], [data-experience-avatar], [data-experience-subject]";
    const observer = new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.addedNodes).some((node) => node instanceof Element && (node.matches(contentSelector) || node.querySelector(contentSelector))))) {
        applyContentPreferences();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      themeMedia.removeEventListener("change", applySystemPreferences);
      motionMedia.removeEventListener("change", applySystemPreferences);
      clearExperienceStyles();
    };
  }, [preferences, ready, enabled, pathname]);

  const value = useMemo(() => ({ preferences, ready, storageKey, storageError, update }), [preferences, ready, storageKey, storageError, update]);
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useStudentExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error("StudentExperienceProvider não foi montado.");
  return context;
}

export function StudentGreeting({ name }: { name: string }) {
  const { preferences } = useStudentExperience();
  return <>{preferences.greeting}, {preferences.displayName || name}!</>;
}
