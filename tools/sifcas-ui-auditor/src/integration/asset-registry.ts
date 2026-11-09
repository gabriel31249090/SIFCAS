export type AssetRegistryEntry = {
  filename: string;
  width: number;
  height: number;
  alpha?: boolean;
  focalPoint?: { x: number; y: number };
  safeArea?: { x: number; y: number; width: number; height: number };
};

export function validateAssetRegistry(entries: AssetRegistryEntry[]) {
  const errors = entries.flatMap((entry, index) => {
    if (!entry.filename || !Number.isFinite(entry.width) || entry.width <= 0 || !Number.isFinite(entry.height) || entry.height <= 0) {
      return [{ index, filename: entry.filename, error: "filename and positive intrinsic dimensions are required" }];
    }
    return [];
  });
  return { valid: errors.length === 0, entries, errors };
}
