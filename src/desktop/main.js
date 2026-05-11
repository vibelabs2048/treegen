import { app, BrowserWindow, shell } from "electron";
import { startServer } from "../server.js";

let mainWindow = null;
let localServer = null;

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
