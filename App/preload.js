// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer, ipcMain } = require("electron");

// Bluetooth serial API
contextBridge.exposeInMainWorld("bt", {
  refreshPorts: () => ipcRenderer.invoke("refresh-ports"),
	listPorts: () => ipcRenderer.invoke("list-ports"),
	getSmartScalePort: () => ipcRenderer.invoke("get-smart-scale-port"),
	connectPort: () => ipcRenderer.invoke("connect-port"),
  disconnectPort: () => ipcRenderer.invoke("disconnect-port"),
});
