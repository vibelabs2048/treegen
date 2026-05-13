const APP_META = {
  version: "0.2.46",
  lastUpdated: "2026-05-12",
};

const RELEASE_OWNER = "vibelabs2048";
const RELEASE_REPO = "treegen";
const RELEASES_BASE = `https://github.com/${RELEASE_OWNER}/${RELEASE_REPO}/releases/latest`;
const RELEASE_API = `https://api.github.com/repos/${RELEASE_OWNER}/${RELEASE_REPO}/releases/latest`;

const versionBadge = document.getElementById("downloads-version-badge");
const summary = document.getElementById("downloads-summary");
const updated = document.getElementById("downloads-updated");
const grid = document.getElementById("downloads-grid");
const targetSelect = document.getElementById("downloads-target-select");
let selectedTarget = "";
let latestTargets = [];
let latestTag = "latest";

init().catch((error) => {
  console.error(error);
  renderFallback();
});

async function init() {
  versionBadge.textContent = `Site v${APP_META.version}`;
  selectedTarget = selectedTarget || detectTarget();
  const release = await fetchLatestRelease();
  renderRelease(release);
}

async function fetchLatestRelease() {
  const response = await fetch(RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub release lookup failed: HTTP ${response.status}`);
  }
  return response.json();
}

function renderRelease(release) {
  const tag = release.tag_name || "latest";
  const published = release.published_at ? new Date(release.published_at) : null;
  latestTag = tag;
  versionBadge.textContent = tag;
  summary.textContent = `Download the current desktop release for Windows, macOS, or Linux.`;
  updated.textContent = published
    ? `Published ${published.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`
    : `Latest release`;

  latestTargets = [
    {
      key: "windows-x64",
      title: "Windows x64",
      icon: "Win",
      description: "64-bit Windows installer plus a portable executable.",
      primaryName: "TreeGen-Windows-Setup.exe",
      primaryLabel: "Download Setup",
      secondaryName: "TreeGen-Windows-Portable.exe",
      secondaryLabel: "Portable EXE",
    },
    {
      key: "macos-arm64",
      title: "macOS arm64",
      icon: "Mac",
      description: "Apple silicon Mac build, with DMG and ZIP packages.",
      primaryName: "TreeGen-macOS.dmg",
      primaryLabel: "Download DMG",
      secondaryName: "TreeGen-macOS.zip",
      secondaryLabel: "ZIP Package",
    },
    {
      key: "linux-x64",
      title: "Linux x64",
      icon: "Lin",
      description: "64-bit Linux build, with AppImage and Debian package.",
      primaryName: "TreeGen-Linux.AppImage",
      primaryLabel: "Download AppImage",
      secondaryName: "TreeGen-Linux.deb",
      secondaryLabel: "DEB Package",
    },
  ].map((item) => attachReleaseMetadata(item, release.assets || []));
  renderTargetSelect();
  renderCards();
}

function renderCards() {
  const activeTarget = latestTargets.find((item) => item.key === selectedTarget) || latestTargets[0];
  grid.innerHTML = activeTarget ? [renderCard(activeTarget, latestTag, true)].join("") : "";
  grid.querySelectorAll("[data-hash-target]").forEach((button) => {
    button.addEventListener("click", () => toggleHash(button.getAttribute("data-hash-target")));
  });
}

function renderCard(item, tag, recommended) {
  const primaryHref = `${RELEASES_BASE}/download/${item.primaryName}`;
  const secondaryHref = `${RELEASES_BASE}/download/${item.secondaryName}`;
  const hashId = `hash-${item.key}`;
  const hashValue = item.primaryDigest || item.secondaryDigest || "";
  return `
    <article class="download-card${recommended ? " recommended" : ""}">
      <div class="download-card-header">
        <div class="download-card-title">
          <span class="download-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.title}</span>
        </div>
        ${recommended ? '<span class="download-badge">Recommended</span>' : ""}
      </div>
      <p>${item.description}</p>
      <p class="help-text">Version ${escapeHtml(tag)}</p>
      <div class="download-actions">
        <a class="download-link" href="${primaryHref}" target="_blank" rel="noopener noreferrer">${item.primaryLabel}</a>
        <a class="download-link" href="${secondaryHref}" target="_blank" rel="noopener noreferrer">${item.secondaryLabel}</a>
      </div>
      ${hashValue ? `
        <div class="hash-row">
          <button class="hash-toggle" type="button" data-hash-target="${hashId}" title="Show the GitHub-provided SHA-256 digest for this download">Show SHA-256</button>
          <div id="${hashId}" class="hash-value">${escapeHtml(hashValue)}</div>
        </div>
      ` : ""}
    </article>
  `;
}

function renderFallback() {
  versionBadge.textContent = `Site v${APP_META.version}`;
  summary.textContent = "Desktop downloads are still available even if release details cannot be loaded right now.";
  updated.textContent = "Direct download links are shown below.";
  latestTag = "latest";
  latestTargets = [
    {
      key: "windows-x64",
      title: "Windows x64",
      icon: "Win",
      description: "64-bit Windows installer plus a portable executable.",
      primaryName: "TreeGen-Windows-Setup.exe",
      primaryLabel: "Download Setup",
      secondaryName: "TreeGen-Windows-Portable.exe",
      secondaryLabel: "Portable EXE",
    },
    {
      key: "macos-arm64",
      title: "macOS arm64",
      icon: "Mac",
      description: "Apple silicon Mac build, with DMG and ZIP packages.",
      primaryName: "TreeGen-macOS.dmg",
      primaryLabel: "Download DMG",
      secondaryName: "TreeGen-macOS.zip",
      secondaryLabel: "ZIP Package",
    },
    {
      key: "linux-x64",
      title: "Linux x64",
      icon: "Lin",
      description: "64-bit Linux build, with AppImage and Debian package.",
      primaryName: "TreeGen-Linux.AppImage",
      primaryLabel: "Download AppImage",
      secondaryName: "TreeGen-Linux.deb",
      secondaryLabel: "DEB Package",
    },
  ];
  selectedTarget = selectedTarget || detectTarget();
  renderTargetSelect();
  renderCards();
}

function detectTarget() {
  const platform = String(
    window.navigator.userAgentData?.platform ||
    window.navigator.platform ||
    window.navigator.userAgent ||
    ""
  ).toLowerCase();
  const architecture = String(window.navigator.userAgentData?.architecture || "").toLowerCase();
  if (platform.includes("mac")) {
    return "macos-arm64";
  }
  if (platform.includes("win")) {
    return "windows-x64";
  }
  if (platform.includes("linux") || platform.includes("x11")) {
    return "linux-x64";
  }
  if (architecture.includes("arm")) {
    return "macos-arm64";
  }
  return "windows-x64";
}

function detectPlatform() {
  const value = String(
    window.navigator.userAgentData?.platform ||
    window.navigator.platform ||
    window.navigator.userAgent ||
    ""
  ).toLowerCase();
  if (value.includes("mac")) return "macos";
  if (value.includes("win")) return "windows";
  if (value.includes("linux") || value.includes("x11")) return "linux";
  return "";
}

function renderTargetSelect() {
  if (!targetSelect) return;
  targetSelect.innerHTML = latestTargets.map((item) => {
    const selected = item.key === selectedTarget ? " selected" : "";
    return `<option value="${item.key}"${selected}>${item.title}</option>`;
  }).join("");
  targetSelect.onchange = () => {
    selectedTarget = targetSelect.value;
    renderCards();
  };
}

function attachReleaseMetadata(item, assets) {
  const primary = assets.find((asset) => asset.name === item.primaryName);
  const secondary = assets.find((asset) => asset.name === item.secondaryName);
  return {
    ...item,
    primaryDigest: normalizeDigest(primary?.digest),
    secondaryDigest: normalizeDigest(secondary?.digest),
  };
}

function normalizeDigest(value) {
  const text = String(value || "");
  return text.startsWith("sha256:") ? text.slice("sha256:".length) : text;
}

function toggleHash(id) {
  const node = document.getElementById(id);
  if (!node) return;
  node.classList.toggle("visible");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
