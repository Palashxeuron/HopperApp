const { ipcMain, BrowserWindow, app, dialog } = require("electron");
const { ConnectionHandler } = require("./connectionHandler.js");

class IpcHandler {
  constructor(mainWindow) {
    // setup local fileStorage
    this.connectionHandler = new ConnectionHandler();
    this.initDone = this.init(mainWindow);
  }
  async init(mainWindow) {
    this.setupHandles(mainWindow);
  }
  ready() {
    return this.initDone;
  }

  setupHandles() {
    ipcMain.handle("refresh-ports", (event, route) => {
      return this.connectionHandler.listSerialPorts();
    });
    ipcMain.handle("list-ports", (event, route) => {
      return {
        ports: this.connectionHandler.ports,
        html: this.connectionHandler.tableHTML,
      };
    });
    ipcMain.handle("get-smart-scale-port", async (event, route) => {
      return await this.connectionHandler.checkPorts();
    });
    ipcMain.handle("connect-port", (event, route) => {
      return this.connectionHandler.openPort(port);
    });
    ipcMain.handle("disconnect-port", (event, route) => {
      return this.connectionHandler.closePort(port);
    });
    ipcMain.handle("get-chart-data", (event, route) => {
      return this.connectionHandler.getData();
    });
    ipcMain.handle("get-local-path", async (event, route) => {
      const selectedPath = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      const filepath = selectedPath.filePaths[0];
    //   console.log("selectedPath", filepath);
      return filepath;
    });
  }
}
module.exports = IpcHandler;
