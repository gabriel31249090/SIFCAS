import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { aeroAssets, aeroSpriteStyle, findAeroAsset, parseAeroAsset } from "../lib/aero-assets.ts";
import { defaultStudentExperience, experienceCss, parseStudentExperience } from "../lib/student-experience.ts";

test("Aero artwork has unique identities, local sources and crops within its source sheet", () => {
  assert.equal(new Set(aeroAssets.map(({ id }) => id)).size, aeroAssets.length);
  assert.equal(new Set(aeroAssets.map(({ kind }) => kind)).size, 6);
  for (const asset of aeroAssets) {
    assert.match(asset.id, /^asset-[a-z]+-\d+$/);
    assert.match(asset.src, /^\/assets\/aero\/[a-z0-9-]+\.png$/);
    assert.ok(fs.existsSync(`public${asset.src}`), asset.src);
    const [x, y, width, height] = asset.crop;
    assert.ok([x, y, width, height, asset.width, asset.height].every(Number.isFinite), asset.id);
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0, asset.id);
    assert.ok(x + width <= asset.width && y + height <= asset.height, `${asset.id} crosses its sheet bounds`);
    for (const square of [false, true]) {
      const style = aeroSpriteStyle(asset, square);
      assert.equal(style.backgroundImage, `url("${asset.src}")`);
      assert.doesNotMatch(style.backgroundSize + style.backgroundPosition, /NaN|Infinity/);
      const positions = style.backgroundPosition.split(" ").map(parseFloat);
      assert.ok(positions.every((position) => position >= 0 && position <= 100), asset.id);
    }
  }
});

test("frame and sticker sprites preserve transparency", () => {
  for (const kind of ["frame", "sticker"]) {
    const asset = aeroAssets.find((item) => item.kind === kind);
    assert.ok(asset);
    const source = fs.readFileSync(`public${asset.src}`);
    assert.equal(source.toString("ascii", 1, 4), "PNG");
    assert.equal(source[25], 6, `${asset.src} must be an RGBA PNG`);
  }
});

test("Aero selections reject outside URLs, unknown IDs and assets of another category", () => {
  for (const value of [undefined, null, {}, [], 1, "https://example.invalid/a.png", "//outside/a.png", "url(javascript:alert(1))", "asset-missing-1"]) {
    assert.equal(parseAeroAsset(value, "avatar"), "none");
  }
  for (const asset of aeroAssets) {
    assert.equal(parseAeroAsset(asset.id, asset.kind), asset.id);
    assert.equal(findAeroAsset(asset.id, asset.kind), asset);
    const otherKind = asset.kind === "avatar" ? "wallpaper" : "avatar";
    assert.equal(parseAeroAsset(asset.id, otherKind), "none");
    assert.equal(findAeroAsset(asset.id, otherKind), undefined);
  }
});

test("preference import only admits artwork from the matching category", () => {
  const accepted = parseStudentExperience({
    wallpaper: "asset-landscape-1", profileAvatar: "asset-glass-1", profileBannerArt: "asset-banner-1",
    profileFrameArt: "asset-frame-1", buttonSkin: "asset-button-1", desktopSticker: "asset-sticker-1",
  });
  assert.equal(accepted.wallpaper, "asset-landscape-1");
  assert.equal(accepted.profileAvatar, "asset-glass-1");
  assert.equal(accepted.profileBannerArt, "asset-banner-1");
  assert.equal(accepted.profileFrameArt, "asset-frame-1");
  assert.equal(accepted.buttonSkin, "asset-button-1");
  assert.equal(accepted.desktopSticker, "asset-sticker-1");

  const rejected = parseStudentExperience({
    wallpaper: "asset-glass-1", profileAvatar: "https://outside.example/avatar.png", profileBannerArt: "asset-frame-1",
    profileFrameArt: "asset-banner-1", buttonSkin: "asset-sticker-1", desktopSticker: "asset-button-1",
  });
  assert.equal(rejected.wallpaper, defaultStudentExperience.wallpaper);
  assert.equal(experienceCss(rejected).wallpaper, "");
  for (const key of ["profileAvatar", "profileBannerArt", "profileFrameArt", "buttonSkin", "desktopSticker"]) assert.equal(rejected[key], "none", key);
});

test("old appearance records retain their choices and get Frutiger Aero defaults for the new collection", () => {
  const previous = parseStudentExperience({ wallpaper: "photo-lake", profileFrame: "gold", profileBanner: "leaves", theme: "dark", favorites: ["/editais"] });
  const defaultArt = {
    profileAvatar: "asset-glass-1",
    profileBannerArt: "asset-banner-1",
    profileFrameArt: "asset-frame-1",
    buttonSkin: "asset-button-1",
    desktopSticker: "asset-sticker-1",
  };
  assert.equal(previous.wallpaper, "photo-lake");
  assert.equal(previous.profileFrame, "gold");
  assert.equal(previous.profileBanner, "leaves");
  assert.equal(previous.theme, "dark");
  assert.deepEqual(previous.favorites, ["/editais"]);
  for (const key of ["profileAvatar", "profileBannerArt", "profileFrameArt", "buttonSkin", "desktopSticker"]) {
    assert.equal(previous[key], defaultArt[key], key);
    assert.equal(defaultStudentExperience[key], defaultArt[key], key);
  }
});
