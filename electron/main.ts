import { app, BrowserWindow, ipcMain, shell, session } from "electron";
import { join } from "path";

const isDev = !app.isPackaged;

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#1A1F2B",
    show: false,
    icon: join(__dirname, "../public/images/logodevnest.png"),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  return mainWindow;
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  const mainWindow = createWindow();

  ipcMain.handle("get-version", () => app.getVersion());

  ipcMain.on("open-external", (_event, url: string) => {
    shell.openExternal(url);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
