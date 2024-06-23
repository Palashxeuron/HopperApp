const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const url = require("node:url");
const IpcHandler = require("./ipcHandler");

app.commandLine.appendSwitch("enable-web-bluetooth", true);

let ipcHandler;
let mainWindow;
const isPackaged = false;

if (!isPackaged) {
  // electron reload is used only if app is not packaged
  const electronReload = require("electron-reload");
  electronReload(__dirname, {
    // electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    ignored: /node_modules|[/\\]\.|relivedb\.sqlite3$|app\.log/,
    awaitWriteFinish: true,
  });
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: "#ccc",
    webPreferences: {
      nodeIntegration: true, // to allow require
      contextIsolation: true, // allow use with Electron 12+
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // open dev tools
  mainWindow.webContents.openDevTools();
  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
  ipcHandler = new IpcHandler(mainWindow);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
