"use client";

import { findAeroAsset, type AeroAsset } from "@/lib/aero-assets";
import { useStudentExperience } from "./StudentExperienceProvider";

/** Displays a tile of an unchanged source sheet; the browser clips and scales it. */
export function AeroArtwork({ asset, className = "" }: { asset: AeroAsset; className?: string }) {
  return <svg className={`aeroArtwork ${className}`} viewBox={asset.crop.join(" ")} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href={asset.src} width={asset.width} height={asset.height}/></svg>;
}

export function ExperienceWallpaper({ className = "" }: { className?: string }) {
  const { preferences } = useStudentExperience();
  const asset = findAeroAsset(preferences.wallpaper, "wallpaper");
  return asset ? <div className={`experienceArtworkWallpaper ${className}`} aria-hidden="true"><AeroArtwork asset={asset}/></div> : null;
}

export function ExperienceBanner({ className = "" }: { className?: string }) {
  const { preferences } = useStudentExperience();
  const asset = findAeroAsset(preferences.profileBannerArt, "banner");
  return asset ? <div className={`experienceArtworkBanner ${className}`} aria-hidden="true"><AeroArtwork asset={asset}/></div> : null;
}

export function ExperiencePortrait({ initials, preview = false }: { initials: string; preview?: boolean }) {
  const { preferences } = useStudentExperience();
  const frame = findAeroAsset(preferences.profileFrameArt, "frame");
  return <div className={`experiencePortrait ${frame ? "hasArtFrame" : ""} ${preview ? "isPreview" : ""}`}>{frame && <AeroArtwork asset={frame}/>}<div className="profileAvatar" data-experience-avatar>{initials}</div></div>;
}

export function ExperienceSticker() {
  const { preferences } = useStudentExperience();
  const asset = findAeroAsset(preferences.desktopSticker, "sticker");
  return asset ? <div className="experienceDesktopSticker" aria-hidden="true"><AeroArtwork asset={asset}/></div> : null;
}
