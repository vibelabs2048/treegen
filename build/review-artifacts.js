import fs from "node:fs";
import path from "node:path";

import { analyzeYamlLayout, renderYamlToSvg } from "../src/renderer-core.js";
import { normalizeExportOptions, renderArtifact } from "../src/render-output.js";

const repoRoot = process.cwd();
const inputPath = path.join(repoRoot, "examples", "demo-placeholder.yaml");
const outputDir = path.join(repoRoot, "artifacts", "qa-review");

fs.mkdirSync(outputDir, { recursive: true });

const yamlText = fs.readFileSync(inputPath, "utf8");
const svg = renderYamlToSvg(yamlText);
const fitReport = analyzeYamlLayout(yamlText);
const exportOptions = normalizeExportOptions({
  widthInches: 11,
  heightInches: 8.5,
  dpi: 600,
  quality: 100,
  pageMarginPoints: 36,
});

await writeArtifact("demo.svg", await renderArtifact(svg, "svg", exportOptions));
await writeArtifact("demo.png", await renderArtifact(svg, "png", exportOptions));
await writeArtifact("demo.pdf", await renderArtifact(svg, "pdf", exportOptions));

fs.writeFileSync(
  path.join(outputDir, "fit-report.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      input: path.relative(repoRoot, inputPath),
      exportOptions,
      fitReport,
    },
    null,
    2
  )}\n`
);

fs.writeFileSync(
  path.join(outputDir, "README.txt"),
  [
    "TreeGen QA Review Bundle",
    "",
    "Files:",
    "- demo.svg",
    "- demo.png",
    "- demo.pdf",
    "- fit-report.json",
    "",
    "Use this bundle to compare the same chart across vector, raster, and PDF outputs before publishing.",
    "",
  ].join("\n")
);

console.log(`Wrote QA review bundle to ${outputDir}`);

async function writeArtifact(filename, artifact) {
  fs.writeFileSync(path.join(outputDir, filename), artifact.buffer);
}
