"use client";

import Image from "next/image";
import { aeroImage, aeroSpriteStyle, findAeroAsset, type AeroAsset } from "@/lib/aero-assets";
import { useStudentExperience } from "./StudentExperienceProvider";

/** Crops are optimized at build preparation time, without a hosted image service. */
export function AeroArtwork({ asset, className = "", thumbnail = false }: { asset: AeroAsset; className?: string; thumbnail?: boolean }) {
  const image = aeroImage(asset, thumbnail);
  return <Image className={`aeroArtwork ${className}`} src={image.src} width={image.width} height={image.height} style={{ objectFit: "cover" }} alt="" aria-hidden="true" unoptimized loading={thumbnail ? "lazy" : "eager"} decoding="async"/>;
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
  const avatarAsset = findAeroAsset(preferences.profileAvatar, "avatar");
  const avatarStyle = preferences.profilePhoto
    ? { backgroundImage: `url("${preferences.profilePhoto}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" as const, color: "transparent" }
    : avatarAsset
      ? { ...aeroSpriteStyle(avatarAsset, true), color: "transparent" }
      : { color: "" };
  const showInitials = !preferences.profilePhoto && !avatarAsset;

  return <div className={`experiencePortrait ${frame ? "hasArtFrame" : ""} ${preview ? "isPreview" : ""}`}>
    {frame && <AeroArtwork asset={frame}/>}
    <div className="profileAvatar" data-experience-avatar style={avatarStyle}>
      {showInitials ? initials : null}
    </div>
  </div>;
}

export function ExperienceSticker() {
  const { preferences } = useStudentExperience();
  const asset = findAeroAsset(preferences.desktopSticker, "sticker");
  return asset ? <div className="experienceDesktopSticker" aria-hidden="true"><AeroArtwork asset={asset}/></div> : null;
}
