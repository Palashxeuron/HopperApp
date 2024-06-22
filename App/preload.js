// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer, ipcMain } = require("electron");

contextBridge.exposeInMainWorld("bt", {
  refreshPorts: () => ipcRenderer.invoke("refresh-ports"),
	listPorts: () => ipcRenderer.invoke("list-ports"),
  getLocalPath: () => ipcRenderer.invoke("get-local-path"),
  getChartData: () => ipcRenderer.invoke("get-chart-data"),
  connectSmartScale: () => ipcRenderer.invoke("connect-smart-scale"),
  startTest: () => ipcRenderer.invoke("start-test"),
});


contextBridge.exposeInMainWorld('logger', {
  logMessage: (level, message) => ipcRenderer.send('log-message', { level, message }),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message))
});