import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(__dirname);

const files = [
  "treegen.png",
  "docs/example-family-tree.png",
  "public/apple-touch-icon.png",
  "public/favicon-32.png",
  "public/favicon-64.png",
  "public/treegen-app-icon.png",
  "public/treegen-logo.png",
  "public/treegen-logo.webp",
  "build/icons/icon-128.png",
  "build/icons/icon-256.png",
  "build/icons/icon-512.png",
];

for (const relative of files) {
  const target = path.join(repoRoot, relative);
  try {
    await fs.access(target);
  } catch {
    continue;
  }
  const extension = path.extname(target).toLowerCase();
  const buffer = await sharp(target).rotate().toBuffer();
  if (extension === ".webp") {
    await sharp(buffer).webp({ quality: 95 }).toFile(target);
  } else {
    await sharp(buffer).png().toFile(target);
  }
}

console.log("Stripped metadata from tracked raster assets");
