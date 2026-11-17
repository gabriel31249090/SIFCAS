export type IFOSViewport = { width: number; height: number };
export type IFOSGeometry = { x: number; y: number; width: number; height: number };
export type IFOSWindowLayout = IFOSGeometry & { href: string; minimized: boolean; maximized: boolean };
export type IFOSWorkspace = { version: 1; windows: IFOSWindowLayout[]; showDesktop: boolean };

export const maxIFOSWindows = 64;
const maxWorkspaceLength = 32_768;
const defaults: IFOSGeometry = { x: 140, y: 100, width: 550, height: 480 };

export function ifosWorkspaceStorageKey(experienceKey: string) {
  return `sifcas:ifos-workspace:v1:${experienceKey}`;
}

export function emptyIFOSWorkspace(): IFOSWorkspace {
  return { version: 1, windows: [], showDesktop: false };
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clampIFOSGeometry(geometry: IFOSGeometry, viewport: IFOSViewport): IFOSGeometry {
  const viewportWidth = finite(viewport.width) ? Math.max(1, viewport.width) : 1200;
  const viewportHeight = finite(viewport.height) ? Math.max(1, viewport.height) : 800;
  const left = Math.min(10, Math.max(0, viewportWidth - 1));
  const top = Math.min(72, Math.max(0, viewportHeight - 1));
  const availableWidth = Math.max(1, viewportWidth - left - 10);
  const availableHeight = Math.max(1, viewportHeight - top - 69);
  const width = Math.round(Math.max(Math.min(320, availableWidth), Math.min(availableWidth, finite(geometry.width) ? geometry.width : defaults.width)));
  const height = Math.round(Math.max(Math.min(240, availableHeight), Math.min(availableHeight, finite(geometry.height) ? geometry.height : defaults.height)));
  return {
    x: Math.round(Math.max(left, Math.min(viewportWidth - width - 10, finite(geometry.x) ? geometry.x : defaults.x))),
    y: Math.round(Math.max(top, Math.min(viewportHeight - height - 69, finite(geometry.y) ? geometry.y : defaults.y))),
    width,
    height,
  };
}

export function resizeIFOSGeometry(geometry: IFOSGeometry, delta: { width: number; height: number }, viewport: IFOSViewport): IFOSGeometry {
  const current = clampIFOSGeometry(geometry, viewport);
  // Resizing keeps the upper left corner in place, including at viewport edges.
  return clampIFOSGeometry({
    ...current,
    width: Math.min(current.width + delta.width, viewport.width - current.x - 10),
    height: Math.min(current.height + delta.height, viewport.height - current.y - 69),
  }, viewport);
}

export function parseIFOSWorkspace(raw: string | null, allowedHrefs: ReadonlySet<string>, viewport: IFOSViewport): IFOSWorkspace {
  if (!raw || raw.length > maxWorkspaceLength) return emptyIFOSWorkspace();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return emptyIFOSWorkspace(); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyIFOSWorkspace();
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || !Array.isArray(candidate.windows)) return emptyIFOSWorkspace();
  const seen = new Set<string>();
  const windows: IFOSWindowLayout[] = [];
  for (const entry of candidate.windows.slice(0, maxIFOSWindows)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.href !== "string" || !allowedHrefs.has(item.href) || seen.has(item.href)) continue;
    if (![item.x, item.y, item.width, item.height].every(finite) || typeof item.minimized !== "boolean" || typeof item.maximized !== "boolean") continue;
    seen.add(item.href);
    const geometry = clampIFOSGeometry({ x: item.x as number, y: item.y as number, width: item.width as number, height: item.height as number }, viewport);
    windows.push({ href: item.href, ...geometry, minimized: item.minimized, maximized: item.maximized });
  }
  return { version: 1, windows, showDesktop: candidate.showDesktop === true };
}

export function serializeIFOSWorkspace(windows: IFOSWindowLayout[], showDesktop: boolean) {
  // Explicit fields prevent application data, content and timer state from entering storage.
  return JSON.stringify({
    version: 1,
    windows: windows.slice(0, maxIFOSWindows).map(({ href, x, y, width, height, minimized, maximized }) => ({ href, x, y, width, height, minimized, maximized })),
    showDesktop,
  } satisfies IFOSWorkspace);
}
