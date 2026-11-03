import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import type { ModuleIconName } from "@/lib/module-catalog";
import { ModuleIcon } from "./ModuleIcon";

export type AeroTone = "sky" | "leaf" | "amber" | "coral" | "violet";
type AeroIconProps = {
  tone?: AeroTone;
  /** Glyph size in pixels; the surrounding tile is twice this size. */
  size?: number;
  className?: string;
  plain?: boolean;
} & ({ name: ModuleIconName; icon?: never } | { icon: LucideIcon; name?: never });

const tones: Partial<Record<ModuleIconName, AeroTone>> = {
  home: "sky", assistant: "violet", tasks: "amber", student: "sky", book: "leaf",
  calendar: "sky", grades: "leaf", clock: "sky", file: "sky", services: "sky",
  request: "coral", help: "sky", link: "leaf", compass: "leaf", process: "sky",
  briefcase: "amber", heart: "coral", research: "violet", news: "sky", notice: "amber",
  campus: "leaf", search: "sky", profile: "leaf", bell: "amber", settings: "sky",
  users: "leaf", audit: "sky", activity: "leaf", shield: "leaf", bug: "coral",
};

/** Decorative, local vector icon family. The adjacent label supplies the accessible name. */
export function AeroIcon(props: AeroIconProps) {
  const { tone, size = 22, className = "", plain = false } = props;
  const color = tone ?? (props.name ? tones[props.name] : undefined) ?? "sky";
  const Icon = props.icon;
  return <span
    className={`aeroIcon${plain ? " aeroIconPlain" : ""}${className ? ` ${className}` : ""}`}
    data-tone={color}
    style={{ "--aero-icon-size": `${size}px` } as CSSProperties}
    aria-hidden="true"
  >
    {Icon ? <Icon size={size} strokeWidth={1.8} aria-hidden="true"/> : <ModuleIcon name={props.name!} size={size}/>}
  </span>;
}
