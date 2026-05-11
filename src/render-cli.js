import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { renderYamlToSvg } from "./renderer-core.js";
import { normalizeExportOptions, renderArtifact } from "./render-output.js";

const { values, positionals } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o" },
    "width-in": { type: "string" },
    "height-in": { type: "string" },
    dpi: { type: "string" },
    quality: { type: "string" },
  },
  allowPositionals: true,
});

const inputPath = values.input || positionals[0];
if (!inputPath) {
  console.error("Usage: node src/render-cli.js --input examples/demo-placeholder.yaml --output artifacts/out.svg [--width-in 11 --height-in 8.5 --dpi 600 --quality 100]");
  process.exit(1);
}

const exportOptions = normalizeExportOptions(values);
const resolvedInput = path.resolve(inputPath);
const yamlText = fs.readFileSync(resolvedInput, "utf8");
const svg = renderYamlToSvg(yamlText);
const outputPath = path.resolve(values.output || defaultOutputPath(resolvedInput));
const format = inferFormat(outputPath);
const artifact = await renderArtifact(svg, format, exportOptions);
fs.writeFileSync(outputPath, artifact.buffer);
console.log(`Rendered ${path.basename(resolvedInput)} -> ${outputPath}`);

function defaultOutputPath(input) {
  const parsed = path.parse(input);
  return path.join(parsed.dir, `${parsed.name}.svg`);
}

function inferFormat(outputPath) {
  const extension = path.extname(outputPath).toLowerCase();
  if (!extension || extension === ".svg") return "svg";
  return extension.replace(/^\./, "");
}
