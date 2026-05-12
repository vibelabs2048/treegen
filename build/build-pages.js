import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(__dirname);
const outDir = path.join(repoRoot, "site");

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

await copyDir(path.join(repoRoot, "public"), path.join(outDir, "public"));
await copyDir(path.join(repoRoot, "src"), path.join(outDir, "src"));

await fs.copyFile(path.join(repoRoot, "public", "index.html"), path.join(outDir, "index.html"));
await fs.copyFile(path.join(repoRoot, "public", "index.html"), path.join(outDir, "404.html"));

console.log(`Built static Pages demo in ${outDir}`);

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}
