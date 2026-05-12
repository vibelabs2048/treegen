import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../server.js";

let mainWindow = null;
let localServer = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
