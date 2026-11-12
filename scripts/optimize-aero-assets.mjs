import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { aeroAssets, aeroImage } from "../lib/aero-assets.ts";

const root = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(root, "public/assets/aero/optimized/manifest.json");
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const localPath = (url) => path.join(root, "public", url);
const check = process.argv.includes("--check");
const sourceBuffers = new Map();
for (const asset of aeroAssets) if (!sourceBuffers.has(asset.src)) sourceBuffers.set(asset.src, await fs.readFile(localPath(asset.src)));
const sources = [...sourceBuffers].map(([src, buffer]) => ({ src, bytes: buffer.length, sha256: hash(buffer) }));
const artifacts = [];
if (!check) await fs.mkdir(path.dirname(reportPath), { recursive: true });

for (const asset of aeroAssets) {
  const [left, top, width, height] = asset.crop;
  for (const thumbnail of [false, true]) {
    const image = aeroImage(asset, thumbnail);
    const buffer = check
      ? await fs.readFile(localPath(image.src))
      : await sharp(sourceBuffers.get(asset.src)).extract({ left, top, width, height }).resize(image.width, image.height).webp({ quality: 88, alphaQuality: 100, effort: 5 }).toBuffer();
    const metadata = await sharp(buffer).metadata();
    if (metadata.width !== image.width || metadata.height !== image.height || metadata.format !== "webp") throw new Error(`Dimensões/formato incorretos: ${image.src}`);
    if (["frame", "sticker"].includes(asset.kind) && !metadata.hasAlpha) throw new Error(`Transparência ausente: ${image.src}`);
    if (!check) await fs.writeFile(localPath(image.src), buffer);
    artifacts.push({ id: asset.id, thumbnail, ...image, bytes: buffer.length, sha256: hash(buffer) });
  }
}

const manifest = { version: 1, quality: 88, thumbnailMaxDimension: 192, sources, artifacts };
if (check) {
  const saved = JSON.parse(await fs.readFile(reportPath, "utf8"));
  if (JSON.stringify(saved) !== JSON.stringify(manifest)) throw new Error("Artes ou catálogo mudaram. Rode npm run assets:optimize para atualizar os recortes.");
} else await fs.writeFile(reportPath, `${JSON.stringify(manifest, null, 2)}\n`);

const sheetsBytes = sources.reduce((sum, item) => sum + item.bytes, 0);
const fullBytes = artifacts.filter((item) => !item.thumbnail).reduce((sum, item) => sum + item.bytes, 0);
const thumbBytes = artifacts.filter((item) => item.thumbnail).reduce((sum, item) => sum + item.bytes, 0);
console.log(JSON.stringify({ mode: check ? "verified" : "generated", artworks: aeroAssets.length, files: artifacts.length, originalSheetsBytes: sheetsBytes, fullCropsBytes: fullBytes, thumbnailsBytes: thumbBytes }, null, 2));
