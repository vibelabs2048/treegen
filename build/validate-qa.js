import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const qaDir = path.join(repoRoot, "artifacts", "qa-review");
const fitReportPath = path.join(qaDir, "fit-report.json");
const svgPath = path.join(qaDir, "demo.svg");
const pngPath = path.join(qaDir, "demo.png");
const pdfPath = path.join(qaDir, "demo.pdf");
const reportPath = path.join(qaDir, "qa-check.json");
const appJsPath = path.join(repoRoot, "src", "app.js");

const errors = [];
const warnings = [];

const fitPayload = JSON.parse(fs.readFileSync(fitReportPath, "utf8"));
const fitReport = Array.isArray(fitPayload?.fitReport) ? fitPayload.fitReport : [];
const svgText = fs.readFileSync(svgPath, "utf8");
const appJsText = fs.readFileSync(appJsPath, "utf8");

checkFileSize(svgPath, 1024, "SVG artifact");
checkFileSize(pngPath, 4096, "PNG artifact");
checkFileSize(pdfPath, 4096, "PDF artifact");
checkSvg(svgText);
checkFitReport(fitReport);
checkPreviewShellConfig(appJsText);

const summary = {
  generatedAt: new Date().toISOString(),
  ok: errors.length === 0,
  errors,
  warnings,
  artifacts: {
    svg: describeFile(svgPath),
    png: describeFile(pngPath),
    pdf: describeFile(pdfPath),
  },
};

fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

if (summary.ok) {
  console.log(`TreeGen QA checks passed. Report: ${path.relative(repoRoot, reportPath)}`);
  if (warnings.length) {
    console.log(`Warnings: ${warnings.join(" | ")}`);
  }
} else {
  console.error(`TreeGen QA checks failed. Report: ${path.relative(repoRoot, reportPath)}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

function describeFile(filePath) {
  const stats = fs.statSync(filePath);
  return {
    path: path.relative(repoRoot, filePath),
    sizeBytes: stats.size,
  };
}

function checkFileSize(filePath, minimumBytes, label) {
  const sizeBytes = fs.statSync(filePath).size;
  if (sizeBytes < minimumBytes) {
    errors.push(`${label} is unexpectedly small (${sizeBytes} bytes).`);
  }
}

function checkSvg(svg) {
  if (!svg.startsWith("<svg")) {
    errors.push("SVG output does not start with an <svg> root.");
  }
  if (!/viewBox="0 0 792 612"/.test(svg)) {
    errors.push("SVG output is missing the expected page viewBox.");
  }
  if (!/width="11in"/.test(svg) || !/height="8\.5in"/.test(svg)) {
    errors.push("SVG output is missing the expected print dimensions.");
  }
  if (/(?:NaN|undefined|null)/.test(svg)) {
    errors.push("SVG output contains invalid literal tokens (NaN/undefined/null).");
  }
  if (/<script\b/i.test(svg)) {
    errors.push("SVG output unexpectedly contains a <script> tag.");
  }
  const numericAttributes = Array.from(svg.matchAll(/\b(?:x|y|width|height|cx|cy|r|rx|ry|stroke-width|font-size)="([^"]+)"/g));
  for (const match of numericAttributes) {
    const rawValue = match[1];
    const value = Number.parseFloat(rawValue);
    if (!Number.isFinite(value)) {
      errors.push(`SVG numeric attribute is not finite: ${rawValue}`);
      break;
    }
  }
}

function checkFitReport(report) {
  if (!report.length) {
    errors.push("Fit report is empty.");
    return;
  }
  for (const generation of report) {
    if (!Number.isFinite(generation.generation)) {
      errors.push("Fit report contains a generation without a numeric index.");
      continue;
    }
    if (generation.boxCount <= 0) {
      errors.push(`Generation ${generation.generation} has no boxes in the fit report.`);
    }
    if (!isFiniteNonNegative(generation.actual?.nameMin) || !isFiniteNonNegative(generation.actual?.nameMax)) {
      errors.push(`Generation ${generation.generation} has invalid name-size metrics.`);
    }
    if (!isFiniteNonNegative(generation.actual?.dateMin) || !isFiniteNonNegative(generation.actual?.dateMax)) {
      errors.push(`Generation ${generation.generation} has invalid date-size metrics.`);
    }
    if (generation.actual?.nameMax > generation.requested?.nameSize + 0.01) {
      errors.push(`Generation ${generation.generation} exceeded its configured name-size ceiling.`);
    }
    if (generation.actual?.dateMax > generation.requested?.dateSize + 0.01) {
      errors.push(`Generation ${generation.generation} exceeded its configured date-size ceiling.`);
    }
    if (generation.limited?.nameCount >= generation.boxCount && generation.generation <= 4) {
      warnings.push(`Generation ${generation.generation} had every box name reduced to fit.`);
    }
  }
}

function checkPreviewShellConfig(source) {
  const margin = readNumericConst(source, "PREVIEW_SVG_MARGIN_PT");
  const fitX = readNumericConst(source, "PREVIEW_FIT_MARGIN_X");
  const fitY = readNumericConst(source, "PREVIEW_FIT_MARGIN_Y");
  if (margin == null || fitX == null || fitY == null) {
    errors.push("Preview shell safety constants are missing from src/app.js.");
    return;
  }
  if (margin < 40) {
    errors.push(`Preview SVG margin is too small (${margin}pt).`);
  }
  if (fitX < 64 || fitY < 88) {
    errors.push(`Preview fit margins are too small (${fitX} x ${fitY}).`);
  }
}

function readNumericConst(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+(?:\\.\\d+)?)\\s*;`));
  return match ? Number.parseFloat(match[1]) : null;
}

function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}
