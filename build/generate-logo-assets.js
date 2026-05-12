import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(__dirname);
const source = path.join(repoRoot, "treegen.png");
const publicDir = path.join(repoRoot, "public");
const iconDir = path.join(repoRoot, "build", "icons");

await fs.mkdir(publicDir, { recursive: true });
await fs.mkdir(iconDir, { recursive: true });

const input = sharp(source);
const trimmedBuffer = await input
  .trim({ background: { r: 123, g: 129, b: 106, alpha: 1 }, threshold: 18 })
  .png()
  .toBuffer();

const logo = sharp(trimmedBuffer);
const metadata = await logo.metadata();
const width = metadata.width || 1024;
const height = metadata.height || 1024;

await logo.clone().resize({ width: 900 }).png().toFile(path.join(publicDir, "treegen-logo.png"));
await logo.clone().resize({ width: 560 }).webp({ quality: 95 }).toFile(path.join(publicDir, "treegen-logo.webp"));

const squareSize = Math.max(width, height);
const squareCanvas = sharp({
  create: {
    width: squareSize,
    height: squareSize,
    channels: 4,
    background: { r: 123, g: 129, b: 106, alpha: 1 },
  },
})
  .composite([
    {
      input: await logo.png().toBuffer(),
      left: Math.round((squareSize - width) / 2),
      top: Math.round((squareSize - height) / 2),
    },
  ]);

const squareBuffer = await squareCanvas.png().toBuffer();
const squareImage = sharp(squareBuffer);

await squareImage.clone().resize(512, 512).png().toFile(path.join(iconDir, "icon-512.png"));
await squareImage.clone().resize(256, 256).png().toFile(path.join(iconDir, "icon-256.png"));
await squareImage.clone().resize(128, 128).png().toFile(path.join(iconDir, "icon-128.png"));
await squareImage.clone().resize(64, 64).png().toFile(path.join(publicDir, "favicon-64.png"));
await squareImage.clone().resize(32, 32).png().toFile(path.join(publicDir, "favicon-32.png"));
await squareImage.clone().resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
await squareImage.clone().resize(512, 512).png().toFile(path.join(publicDir, "treegen-app-icon.png"));

console.log("Generated logo and icon assets from treegen.png");
