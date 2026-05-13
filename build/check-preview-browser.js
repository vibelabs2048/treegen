import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { chromium } from "@playwright/test";

import { startServer } from "../src/server.js";

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "artifacts", "qa-review");
const screenshotPath = path.join(outputDir, "preview-browser.png");
const reportPath = path.join(outputDir, "preview-browser-check.json");

await fs.promises.mkdir(outputDir, { recursive: true });

let browser;
let serverRef;
const pageErrors = [];
const consoleErrors = [];

try {
  serverRef = await startServer({ port: 0 });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message || error));
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.goto(serverRef.url, { waitUntil: "networkidle" });
  await page.waitForSelector("#svg-wrapper svg");
  await page.waitForTimeout(500);
  await dismissFirstRunHelp(page);
  await verifyTopMenus(page);

  const stage = page.locator("main .preview-panel .preview-stage").first();
  await stage.screenshot({ path: screenshotPath });
  const analysis = await measurePreviewGeometry(page);
  const summary = {
    generatedAt: new Date().toISOString(),
    ok: analysis.contentTop >= 12,
    contentTop: analysis.contentTop,
    svgTop: analysis.svgTop,
    width: analysis.width,
    height: analysis.height,
    screenshot: path.relative(repoRoot, screenshotPath),
    pageErrors,
    consoleErrors,
  };

  await fs.promises.writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  if (!summary.ok) {
    console.error(`Preview browser check failed. Preview content starts ${summary.contentTop}px from the top.`);
    process.exitCode = 1;
  } else {
    console.log(`Preview browser check passed. Preview content starts ${summary.contentTop}px from the top.`);
  }
} finally {
  if (browser) {
    await browser.close();
  }
  if (serverRef) {
    await serverRef.close();
  }
}

async function verifyTopMenus(page) {
  const projectsButton = page.getByRole("button", { name: "Projects", exact: true });
  const exportButton = page.getByRole("button", { name: "Export", exact: true });
  const viewButton = page.getByRole("button", { name: "View", exact: true });
  const projectsPanel = page.locator("#projects-menu");
  const exportPanel = page.locator("#export-menu");
  const viewPanel = page.locator("#view-menu");

  await projectsButton.click();
  await assertMenuState(projectsButton, projectsPanel, true, "Projects menu should open on click.");

  await exportButton.click();
  await assertMenuState(exportButton, exportPanel, true, "Export menu should open on click.");
  await assertMenuState(projectsButton, projectsPanel, false, "Projects menu should close when Export opens.");

  await exportButton.click();
  await assertMenuState(exportButton, exportPanel, false, "Export menu should close on second click.");

  await viewButton.click();
  await assertMenuState(viewButton, viewPanel, true, "View menu should open on click.");
  await page.mouse.click(8, 8);
  await assertMenuState(viewButton, viewPanel, false, "Menus should close on outside click.");
}

async function dismissFirstRunHelp(page) {
  const helpModal = page.locator("#help-modal");
  if (!(await helpModal.isVisible().catch(() => false))) {
    return;
  }
  const acceptButton = page.getByRole("button", { name: "Got It" });
  await acceptButton.click();
  await page.waitForFunction(() => {
    const modal = document.getElementById("help-modal");
    return !!modal && modal.hidden;
  });
}

async function assertMenuState(button, panel, expectedOpen, message) {
  const expanded = await button.getAttribute("aria-expanded");
  const isHidden = await panel.evaluate((node) => node.hidden);
  if (expectedOpen) {
    if (expanded !== "true" || isHidden) {
      throw new Error(message);
    }
    return;
  }
  if (expanded !== "false" || !isHidden) {
    throw new Error(message);
  }
}

async function measurePreviewGeometry(page) {
  const metrics = await page.evaluate(() => {
    const stage = document.querySelector("main .preview-panel .preview-stage");
    const svg = document.querySelector("#svg-wrapper svg");
    if (!stage || !svg) {
      throw new Error("Preview stage or SVG is missing.");
    }
    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const bbox = svg.getBBox();
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      throw new Error("Preview SVG screen transform is missing.");
    }
    const topLeft = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm);
    return {
      width: Math.round(stageRect.width),
      height: Math.round(stageRect.height),
      svgTop: Math.round((svgRect.top - stageRect.top) * 100) / 100,
      contentTop: Math.round((topLeft.y - stageRect.top) * 100) / 100,
    };
  });

  const image = sharp(screenshotPath);
  const info = await image.metadata();
  return {
    ...metrics,
    width: info.width || metrics.width,
    height: info.height || metrics.height,
  };
}
