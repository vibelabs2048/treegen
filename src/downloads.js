const APP_META = {
  version: "0.2.28",
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
const platformPicker = document.getElementById("downloads-platform-picker");
let selectedPlatform = "";
let latestDownloads = [];
let latestTag = "latest";

init().catch((error) => {
  console.error(error);
  renderFallback();
});

async function init() {
  versionBadge.textContent = `Site v${APP_META.version}`;
  selectedPlatform = selectedPlatform || detectPlatform();
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

  latestDownloads = [
    {
      key: "windows",
      title: "Windows",
      icon: "Win",
      description: "Installer for most Windows PCs, plus a portable executable.",
      primaryName: "TreeGen-Windows-Setup.exe",
      primaryLabel: "Download Setup",
      secondaryName: "TreeGen-Windows-Portable.exe",
      secondaryLabel: "Portable EXE",
    },
    {
      key: "macos",
      title: "macOS",
      icon: "Mac",
      description: "Disk image for Apple silicon Macs, plus a zip package.",
      primaryName: "TreeGen-macOS.dmg",
      primaryLabel: "Download DMG",
      secondaryName: "TreeGen-macOS.zip",
      secondaryLabel: "ZIP Package",
    },
    {
      key: "linux",
      title: "Linux",
      icon: "Lin",
      description: "AppImage for most desktops, plus a Debian package.",
      primaryName: "TreeGen-Linux.AppImage",
      primaryLabel: "Download AppImage",
      secondaryName: "TreeGen-Linux.deb",
      secondaryLabel: "DEB Package",
    },
  ].map((item) => attachReleaseMetadata(item, release.assets || []));
  renderPlatformPicker();
  renderCards();
}

function renderCards() {
  grid.innerHTML = latestDownloads.map((item) => renderCard(item, latestTag, selectedPlatform === item.key)).join("");
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
  latestDownloads = [
    {
      key: "windows",
      title: "Windows",
      icon: "Win",
      description: "Installer for most Windows PCs, plus a portable executable.",
      primaryName: "TreeGen-Windows-Setup.exe",
      primaryLabel: "Download Setup",
      secondaryName: "TreeGen-Windows-Portable.exe",
      secondaryLabel: "Portable EXE",
    },
    {
      key: "macos",
      title: "macOS",
      icon: "Mac",
      description: "Disk image for Apple silicon Macs, plus a zip package.",
      primaryName: "TreeGen-macOS.dmg",
      primaryLabel: "Download DMG",
      secondaryName: "TreeGen-macOS.zip",
      secondaryLabel: "ZIP Package",
    },
    {
      key: "linux",
      title: "Linux",
      icon: "Lin",
      description: "AppImage for most desktops, plus a Debian package.",
      primaryName: "TreeGen-Linux.AppImage",
      primaryLabel: "Download AppImage",
      secondaryName: "TreeGen-Linux.deb",
      secondaryLabel: "DEB Package",
    },
  ];
  selectedPlatform = selectedPlatform || detectPlatform();
  renderPlatformPicker();
  renderCards();
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

function renderPlatformPicker() {
  if (!platformPicker) return;
  const options = [
    { key: "windows", label: "Windows" },
    { key: "macos", label: "macOS" },
    { key: "linux", label: "Linux" },
  ];
  platformPicker.innerHTML = options.map((option) => {
    const active = selectedPlatform === option.key;
    return `<button class="platform-chip${active ? " active" : ""}" type="button" data-platform="${option.key}" title="Prefer ${option.label} downloads on this page">${option.label}</button>`;
  }).join("");
  platformPicker.querySelectorAll("[data-platform]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlatform = button.getAttribute("data-platform") || "";
      renderPlatformPicker();
      renderCards();
    });
  });
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
