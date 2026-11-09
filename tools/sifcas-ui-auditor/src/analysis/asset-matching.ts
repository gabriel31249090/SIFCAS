export type ContainerMeasure = { width: number; height: number };
export type AssetMeasure = { filename: string; width: number; height: number; alpha?: boolean };

export function fitAsset(container: ContainerMeasure, asset: AssetMeasure) {
  const containerAspectRatio = container.height ? container.width / container.height : 0;
  const assetAspectRatio = asset.height ? asset.width / asset.height : 0;
  const coverScale = Math.max(container.width / asset.width, container.height / asset.height);
  const cropPercentage = asset.width * asset.height === 0 ? 0 :
    Math.max(0, 1 - (container.width / coverScale * container.height / coverScale) / (asset.width * asset.height)) * 100;
  const upscaleFactor = Math.max(container.width / asset.width, container.height / asset.height);
  const fit = Math.abs(containerAspectRatio - assetAspectRatio) > 0.18 ? "cover" : "contain";
  const aspectScore = Math.max(0, 1 - Math.abs(Math.log((assetAspectRatio || 1) / (containerAspectRatio || 1))));
  const resolutionScore = Math.min(1, 1 / Math.max(1, upscaleFactor));
  const transparencyScore = asset.alpha ? 1 : 0.85;
  const score = Math.round((aspectScore * 0.55 + resolutionScore * 0.35 + transparencyScore * 0.1) * 100);
  return {
    component: "measured-container",
    container: { ...container, aspectRatio: containerAspectRatio },
    asset: { ...asset, aspectRatio: assetAspectRatio },
    recommended: {
      objectFit: fit,
      objectPosition: "center",
      compatible: score >= 55,
      score,
      safeArea: "not inferred; specify focal/safe-area metadata when known",
      cropPercentage: Math.round(cropPercentage * 100) / 100,
      upscaleFactor: Math.round(upscaleFactor * 100) / 100,
      preserveTransparency: Boolean(asset.alpha),
    },
  };
}

export function matchAssetsToElements(elements: Array<{ selector: string; image: { currentSrc: string; naturalWidth: number; naturalHeight: number } | null; geometry: { width: number; height: number } }>) {
  return elements.flatMap((element) => {
    if (!element.image || !element.image.currentSrc || element.image.naturalWidth <= 0 || element.image.naturalHeight <= 0) return [];
    return [{
      selector: element.selector,
      ...fitAsset(
        { width: element.geometry.width, height: element.geometry.height },
        { filename: element.image.currentSrc, width: element.image.naturalWidth, height: element.image.naturalHeight },
      ),
    }];
  });
}
