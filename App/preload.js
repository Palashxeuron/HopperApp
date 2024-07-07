// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer, ipcMain } = require("electron");
const packJson = require("./package.json");

contextBridge.exposeInMainWorld("env", {
  version: packJson.version,
});

contextBridge.exposeInMainWorld("bt", {
  refreshPorts: () => ipcRenderer.invoke("refresh-ports"),
  listPorts: () => ipcRenderer.invoke("list-ports"),
  getLocalPath: () => ipcRenderer.invoke("get-local-path"),
  getChartData: () => ipcRenderer.invoke("get-chart-data"),
  connectSmartScale: () => ipcRenderer.invoke("connect-smart-scale"),
  disconnect: () => ipcRenderer.invoke("disconnect"),
  // startTest: () => ipcRenderer.invoke("start-test"),
  isPaired: () => ipcRenderer.invoke("is-paired"),
  tare: () => ipcRenderer.invoke("tare"),
  calibrate: (value) => ipcRenderer.invoke("calibrate", value),
  // startCollectingWeight: () => ipcRenderer.invoke("start-collecting-weight"),
  // stopCollectingWeight: () => ipcRenderer.invoke("stop-collecting-weight"),
  stillConnected: () => ipcRenderer.invoke("still-connected"),
});
contextBridge.exposeInMainWorld("fileStorage", {
  writeData: (data) => ipcRenderer.invoke("save-file", data),
  generateReport: (data) => ipcRenderer.invoke("generate-report", data),
  openResultDir: (data) => ipcRenderer.invoke("open-results-dir", data),
});

contextBridge.exposeInMainWorld("logger", {
  logMessage: (level, message) =>
    ipcRenderer.send("log-message", { level, message }),
  onLogMessage: (callback) =>
    ipcRenderer.on("log-message", (event, message) => callback(message)),
});
