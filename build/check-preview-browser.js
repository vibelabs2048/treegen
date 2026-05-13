import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

import { startServer } from "../src/server.js";

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "artifacts", "qa-review");
const screenshotDir = path.join(outputDir, "preview-browser");
const reportPath = path.join(outputDir, "preview-browser-check.json");
const SCENARIOS = [
  {
    id: "desktop-default",
    viewport: { width: 1440, height: 1024 },
    minContentTop: 18,
    hideEditor: false,
    fullscreen: false,
  },
  {
    id: "desktop-hidden-editor",
    viewport: { width: 1440, height: 1024 },
    minContentTop: 18,
    hideEditor: true,
    fullscreen: false,
  },
  {
    id: "compact-default",
    viewport: { width: 1180, height: 840 },
    minContentTop: 16,
    hideEditor: false,
    fullscreen: false,
  },
  {
    id: "fullscreen-default",
    viewport: { width: 1440, height: 1024 },
    minContentTop: 18,
    hideEditor: false,
    fullscreen: true,
  },
];

await fs.promises.mkdir(screenshotDir, { recursive: true });

let browser;
let serverRef;

try {
  serverRef = await startServer({ port: 0 });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: SCENARIOS[0].viewport, deviceScaleFactor: 1 });
  const pageErrors = [];
  const consoleErrors = [];
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

  const scenarios = [];
  for (const scenario of SCENARIOS) {
    scenarios.push(await runScenario(page, scenario));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    ok: scenarios.every((scenario) => scenario.ok) && pageErrors.length === 0 && consoleErrors.length === 0,
    pageErrors,
    consoleErrors,
    scenarios,
  };

  await fs.promises.writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  if (!summary.ok) {
    const failed = scenarios.filter((scenario) => !scenario.ok).map((scenario) => `${scenario.id}:${scenario.contentTop}px`);
    console.error(`Preview browser check failed. ${failed.join(" | ") || "Browser console/page errors detected."}`);
    process.exitCode = 1;
  } else {
    console.log(`Preview browser check passed. ${scenarios.map((scenario) => `${scenario.id}:${scenario.contentTop}px`).join(" | ")}`);
  }
} finally {
  if (browser) {
    await browser.close();
  }
  if (serverRef) {
    await serverRef.close();
  }
}

async function runScenario(page, scenario) {
  await page.setViewportSize(scenario.viewport);
  await page.waitForTimeout(120);
  await resetViewState(page);

  if (scenario.hideEditor) {
    await toggleEditorVisibility(page, false);
  }

  if (scenario.fullscreen) {
    await openFullscreenPreview(page);
  }

  await page.waitForTimeout(180);

  const geometry = await measurePreviewGeometry(page, scenario.fullscreen ? "fullscreen" : "main");
  const screenshotPath = path.join(screenshotDir, `${scenario.id}.png`);
  await captureScenarioScreenshot(page, screenshotPath, scenario.fullscreen);

  if (scenario.fullscreen) {
    await closeFullscreenPreview(page);
  }
  if (scenario.hideEditor) {
    await toggleEditorVisibility(page, true);
  }

  return {
    id: scenario.id,
    viewport: scenario.viewport,
    minContentTop: scenario.minContentTop,
    ...geometry,
    screenshot: path.relative(repoRoot, screenshotPath),
    ok: geometry.contentTop >= scenario.minContentTop,
  };
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
  await page.getByRole("button", { name: "Got It" }).click();
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

async function resetViewState(page) {
  await closeFullscreenPreview(page, { ignoreMissing: true });
  await closeMenus(page);
  await toggleEditorVisibility(page, true);
  await fitMainPreview(page);
}

async function closeMenus(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.mouse.click(8, 8);
  await page.waitForTimeout(60);
}

async function toggleEditorVisibility(page, shouldShow) {
  const workspaceHidden = await page.locator(".workspace").evaluate((node) => node.classList.contains("editor-hidden"));
  if (workspaceHidden === !shouldShow) {
    return;
  }
  const viewButton = page.getByRole("button", { name: "View", exact: true });
  await viewButton.click();
  const toggleButton = page.locator("#toggle-sidebar");
  await toggleButton.click();
  await page.waitForFunction(
    (visible) => {
      const workspace = document.querySelector(".workspace");
      return !!workspace && workspace.classList.contains("editor-hidden") === !visible;
    },
    shouldShow
  );
}

async function fitMainPreview(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(180);
}

async function openFullscreenPreview(page) {
  await page.locator("#open-fullscreen-preview").click();
  await page.waitForFunction(() => {
    const modal = document.getElementById("fullscreen-preview-modal");
    return !!modal && !modal.hidden;
  });
  await page.waitForTimeout(180);
}

async function closeFullscreenPreview(page, options = {}) {
  const { ignoreMissing = false } = options;
  const modalVisible = await page.evaluate(() => {
    const modal = document.getElementById("fullscreen-preview-modal");
    return !!modal && !modal.hidden;
  });
  if (!modalVisible) {
    if (ignoreMissing) return;
    throw new Error("Fullscreen preview modal was expected to be open.");
  }
  await page.locator("#close-fullscreen-preview").click();
  await page.waitForFunction(() => {
    const modal = document.getElementById("fullscreen-preview-modal");
    return !!modal && modal.hidden;
  });
}

async function captureScenarioScreenshot(page, filePath, fullscreen) {
  const target = fullscreen
    ? page.locator("#fullscreen-preview-stage")
    : page.locator("main .preview-panel .preview-stage").first();
  await target.screenshot({ path: filePath });
}

async function measurePreviewGeometry(page, target) {
  return page.evaluate((mode) => {
    const round2 = (value) => Math.round(value * 100) / 100;
    const stage =
      mode === "fullscreen"
        ? document.querySelector("#fullscreen-preview-stage")
        : document.querySelector("main .preview-panel .preview-stage");
    const svg =
      mode === "fullscreen"
        ? document.querySelector("#fullscreen-svg-wrapper svg")
        : document.querySelector("#svg-wrapper svg");
    if (!stage || !svg) {
      throw new Error(`Preview stage or SVG is missing for ${mode}.`);
    }
    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const bbox = svg.getBBox();
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      throw new Error(`Preview SVG screen transform is missing for ${mode}.`);
    }
    const topLeft = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm);
    const bottomRight = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm);
    return {
      width: Math.round(stageRect.width),
      height: Math.round(stageRect.height),
      svgTop: round2(svgRect.top - stageRect.top),
      contentTop: round2(topLeft.y - stageRect.top),
      contentBottomGap: round2(stageRect.bottom - bottomRight.y),
    };
  }, target);
}
