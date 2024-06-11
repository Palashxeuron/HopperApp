const { ipcMain, BrowserWindow, app } = require("electron");
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
  }
}
module.exports = IpcHandler;
