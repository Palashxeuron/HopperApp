const { ipcMain, BrowserWindow, app, dialog } = require("electron");
const { ConnectionHandler } = require("./connectionHandler.js");
const { Logger } = require("./logger.js");

class IpcHandler {
  constructor(mainWindow) {
    // setup local fileStorage
    this.logger = new Logger(mainWindow);
    this.connectionHandler = new ConnectionHandler(this.logger);
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
    ipcMain.handle("start-test", (event, route) => {
      return this.connectionHandler.startTest();
    });
    ipcMain.handle("is-paired", async (event, route) => {
      await this.connectionHandler.findScalePort();
      return {
        isPaired: this.connectionHandler.isPaired,
        smartScalePort: this.connectionHandler.smartScalePort,
      };
    });
    ipcMain.handle("list-ports", (event, route) => {
      return {
        ports: this.connectionHandler.ports,
        html: this.connectionHandler.tableHTML,
      };
    });
    ipcMain.handle("connect-smart-scale", (event, route) => {
      return this.connectionHandler.connectSmartScale();
    });
    ipcMain.handle("disconnect", (event, route) => {
      return this.connectionHandler.disconnect();
    });
    ipcMain.handle("tare", (event, route) => {
      return this.connectionHandler.tare();
    });
    ipcMain.handle("start-collecting-weight", (event, route) => {
      return this.connectionHandler.startReceivingData();
    });
    ipcMain.handle("stop-collecting-weight", (event, route) => {
      return this.connectionHandler.stopReceivingData();
    });
    ipcMain.handle("calibrate", (event, value) => {
      return this.connectionHandler.calibrate(value);
    });
    ipcMain.handle("get-chart-data", (event, route) => {
      return this.connectionHandler.getData();
    });
    ipcMain.handle("get-local-path", async (event, route) => {
      const selectedPath = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      const filepath = selectedPath.filePaths[0];
      //   console.log("selectedPath", filepath);
      return filepath;
    });
  }
}
module.exports = IpcHandler;
