import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../server.js";

let mainWindow = null;
let localServer = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_EXTENSIONS = ["yaml", "yml"];

function projectDirectory() {
  return path.join(app.getPath("userData"), "projects");
}

function autosavePath() {
  return path.join(projectDirectory(), "autosave.json");
}

function recentProjectsPath() {
  return path.join(projectDirectory(), "recent-projects.json");
}

async function ensureProjectDirectory() {
  await fs.mkdir(projectDirectory(), { recursive: true });
}

async function readRecentProjects() {
  try {
    const raw = await fs.readFile(recentProjectsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRecentProjects(entries) {
  await ensureProjectDirectory();
  await fs.writeFile(recentProjectsPath(), JSON.stringify(entries.slice(0, 12), null, 2), "utf8");
}

async function rememberRecentProject(filePath) {
  const trimmed = String(filePath || "").trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  const entries = (await readRecentProjects()).filter((entry) => entry && entry.path !== trimmed);
  entries.unshift({
    id: `${trimmed}:${now}`,
    path: trimmed,
    name: path.basename(trimmed),
    updatedAt: now,
  });
  await writeRecentProjects(entries);
}

function ensureProjectFileExtension(fileName) {
  const trimmed = String(fileName || "").trim();
  if (!trimmed) return "family-tree.treegen.yaml";
  if (/\.(yaml|yml)$/i.test(trimmed)) return trimmed;
  return `${trimmed}.treegen.yaml`;
}

ipcMain.handle("treegen:open-yaml", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open TreeGen YAML",
    properties: ["openFile"],
    filters: [
      { name: "YAML", extensions: ["yaml", "yml"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true };
  }
  const filePath = result.filePaths[0];
  const text = await fs.readFile(filePath, "utf8");
  return { canceled: false, path: filePath, text };
});

ipcMain.handle("treegen:open-project", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open TreeGen Project",
    properties: ["openFile"],
    filters: [
      { name: "TreeGen Project", extensions: PROJECT_EXTENSIONS },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true };
  }
  const filePath = result.filePaths[0];
  const text = await fs.readFile(filePath, "utf8");
  await rememberRecentProject(filePath);
  return { canceled: false, path: filePath, text };
});

ipcMain.handle("treegen:save-project", async (_event, payload = {}) => {
  const {
    suggestedName = "family-tree.treegen.yaml",
    currentPath = "",
    text = "",
  } = payload;
  await ensureProjectDirectory();
  let filePath = currentPath || "";
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Save TreeGen Project",
      defaultPath: path.join(projectDirectory(), suggestedName),
      filters: [
        { name: "TreeGen Project", extensions: PROJECT_EXTENSIONS },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    filePath = result.filePath;
  }
  await fs.writeFile(filePath, String(text), "utf8");
  const stats = await fs.stat(filePath);
  await rememberRecentProject(filePath);
  return {
    canceled: false,
    path: filePath,
    updatedAt: stats.mtime.toISOString(),
  };
});

ipcMain.handle("treegen:save-project-as", async (_event, payload = {}) => {
  const {
    suggestedName = "family-tree.treegen.yaml",
    text = "",
  } = payload;
  await ensureProjectDirectory();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save TreeGen Project As",
    defaultPath: path.join(projectDirectory(), suggestedName),
    filters: [
      { name: "TreeGen Project", extensions: PROJECT_EXTENSIONS },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  await fs.writeFile(result.filePath, String(text), "utf8");
  const stats = await fs.stat(result.filePath);
  await rememberRecentProject(result.filePath);
  return {
    canceled: false,
    path: result.filePath,
    updatedAt: stats.mtime.toISOString(),
  };
});

ipcMain.handle("treegen:read-autosave", async () => {
  try {
    const filePath = autosavePath();
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return {
      exists: true,
      path: filePath,
      text: typeof data.text === "string" ? data.text : "",
      projectPath: typeof data.projectPath === "string" ? data.projectPath : "",
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
    };
  } catch {
    return { exists: false, text: "", projectPath: "", updatedAt: "" };
  }
});

ipcMain.handle("treegen:write-autosave", async (_event, payload = {}) => {
  const {
    text = "",
    projectPath = "",
  } = payload;
  await ensureProjectDirectory();
  const updatedAt = new Date().toISOString();
  const filePath = autosavePath();
  await fs.writeFile(filePath, JSON.stringify({ text: String(text), projectPath: String(projectPath || ""), updatedAt }, null, 2), "utf8");
  return { path: filePath, updatedAt };
});

ipcMain.handle("treegen:save-file", async (_event, payload = {}) => {
  const {
    suggestedName = "treegen-output.dat",
    filters = [{ name: "All Files", extensions: ["*"] }],
    bytes = [],
  } = payload;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save TreeGen Export",
    defaultPath: suggestedName,
    filters,
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  await fs.writeFile(result.filePath, Buffer.from(bytes));
  return { canceled: false, path: result.filePath };
});

ipcMain.handle("treegen:list-recent-projects", async () => {
  const entries = await readRecentProjects();
  return { entries };
});

ipcMain.handle("treegen:open-recent-project", async (_event, payload = {}) => {
  const filePath = String(payload.path || "").trim();
  if (!filePath) {
    return { canceled: true };
  }
  const text = await fs.readFile(filePath, "utf8");
  await rememberRecentProject(filePath);
  return { canceled: false, path: filePath, text };
});

ipcMain.handle("treegen:rename-recent-project", async (_event, payload = {}) => {
  const filePath = String(payload.path || "").trim();
  const requestedName = ensureProjectFileExtension(payload.name || "");
  if (!filePath || !requestedName) {
    return { renamed: false };
  }
  const nextPath = path.join(path.dirname(filePath), requestedName);
  if (nextPath === filePath) {
    const stats = await fs.stat(filePath);
    return { renamed: true, path: filePath, updatedAt: stats.mtime.toISOString() };
  }
  try {
    await fs.access(nextPath);
    throw new Error(`A project named ${requestedName} already exists in this folder.`);
  } catch (error) {
    if (error && error.code !== "ENOENT") throw error;
  }
  await fs.rename(filePath, nextPath);
  const stats = await fs.stat(nextPath);
  await rememberRecentProject(nextPath);
  return { renamed: true, path: nextPath, updatedAt: stats.mtime.toISOString() };
});

ipcMain.handle("treegen:remove-recent-project", async (_event, payload = {}) => {
  const filePath = String(payload.path || "").trim();
  const entries = (await readRecentProjects()).filter((entry) => entry && entry.path !== filePath);
  await writeRecentProjects(entries);
  return { removed: true };
});

ipcMain.handle("treegen:delete-recent-project", async (_event, payload = {}) => {
  const filePath = String(payload.path || "").trim();
  if (!filePath) {
    return { deleted: false };
  }
  await fs.unlink(filePath);
  const entries = (await readRecentProjects()).filter((entry) => entry && entry.path !== filePath);
  await writeRecentProjects(entries);
  return { deleted: true, path: filePath };
});

async function createWindow() {
  if (!localServer) {
    localServer = await startServer({ port: 0 });
  }

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1020,
    minWidth: 1220,
    minHeight: 760,
    title: "TreeGen",
    autoHideMenuBar: false,
    backgroundColor: "#f4efe5",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(localServer.url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function shutdownServer() {
  if (!localServer) return;
  const serverRef = localServer;
  localServer = null;
  try {
    await serverRef.close();
  } catch {
    // No-op during shutdown.
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("before-quit", async () => {
  await shutdownServer();
});

app.on("window-all-closed", async () => {
  await shutdownServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
