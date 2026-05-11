import { Resvg } from "@resvg/resvg-js";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import sharp from "sharp";

export function normalizeExportOptions(values = {}) {
  return {
    widthInches: clampNumber(values.widthInches ?? values["width-in"], 11, 1, 200),
    heightInches: clampNumber(values.heightInches ?? values["height-in"], 8.5, 1, 200),
    dpi: clampNumber(values.dpi, 600, 72, 2400),
    quality: clampNumber(values.quality, 100, 1, 100),
    pageMarginPoints: clampNumber(values.pageMarginPoints ?? values["page-margin-pt"], 12, 0, 72),
  };
}

export function applyPhysicalSize(svg, widthInches, heightInches) {
  return svg
    .replace(/width="[^"]*"/, `width="${widthInches}in"`)
    .replace(/height="[^"]*"/, `height="${heightInches}in"`);
}

export async function renderArtifact(svg, format, exportOptions) {
  const normalized = normalizeExportOptions(exportOptions);
  const paddedSvg = applyPageMargin(svg, normalized.pageMarginPoints);
  const sizedSvg = applyPhysicalSize(paddedSvg, normalized.widthInches, normalized.heightInches);
  const kind = String(format || "svg").toLowerCase();
  if (kind === "svg") {
    return {
      buffer: Buffer.from(sizedSvg, "utf8"),
      contentType: "image/svg+xml; charset=utf-8",
      extension: "svg",
    };
  }
  if (kind === "pdf") {
    return {
      buffer: await renderPdfBuffer(sizedSvg, normalized),
      contentType: "application/pdf",
      extension: "pdf",
    };
  }
  if (kind === "png" || kind === "jpg" || kind === "jpeg") {
    const extension = kind === "jpeg" ? "jpg" : kind;
    return {
      buffer: await renderRasterBuffer(sizedSvg, extension, normalized),
      contentType: extension === "png" ? "image/png" : "image/jpeg",
      extension,
    };
  }
  throw new Error(`Unsupported output type: ${kind}`);
}

async function renderRasterBuffer(svg, format, exportOptions) {
  const pixelWidth = Math.max(1, Math.round(exportOptions.widthInches * exportOptions.dpi));
  const pixelHeight = Math.max(1, Math.round(exportOptions.heightInches * exportOptions.dpi));
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: pixelWidth,
    },
    background: "rgba(255,253,250,1)",
  });
  const pngData = resvg.render().asPng();
  if (format === "png") {
    return pngData;
  }
  return sharp(pngData)
    .resize(pixelWidth, pixelHeight)
    .jpeg({ quality: exportOptions.quality, mozjpeg: true })
    .toBuffer();
}

function renderPdfBuffer(svg, exportOptions) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const widthPt = exportOptions.widthInches * 72;
    const heightPt = exportOptions.heightInches * 72;
    const doc = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      compress: true,
      info: {
        Title: "TreeGen Export",
      },
    });
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    SVGtoPDF(doc, svg, 0, 0, {
      width: widthPt,
      height: heightPt,
      preserveAspectRatio: "xMidYMid meet",
      useCSS: false,
    });
    doc.end();
  });
}

function applyPageMargin(svg, marginPoints) {
  const margin = Math.max(0, Number(marginPoints) || 0);
  if (!margin) return svg;

  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i);
  if (!viewBoxMatch) return svg;
  const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return svg;
  }
  const [minX, minY, width, height] = parts;
  const innerWidth = Math.max(1, width - margin * 2);
  const innerHeight = Math.max(1, height - margin * 2);
  const openTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (!openTagMatch) return svg;
  const startIndex = openTagMatch.index + openTagMatch[0].length;
  const endIndex = svg.lastIndexOf("</svg>");
  if (endIndex <= startIndex) return svg;
  const innerContent = svg.slice(startIndex, endIndex);
  return `${openTagMatch[0]}<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#fffdfa"/><svg x="${round2(minX + margin)}" y="${round2(minY + margin)}" width="${round2(innerWidth)}" height="${round2(innerHeight)}" viewBox="${minX} ${minY} ${width} ${height}" overflow="visible">${innerContent}</svg></svg>`;
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
