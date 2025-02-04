const { ipcMain, dialog } = require("electron");
const { ConnectionHandler } = require("./connectionHandler.js");
const { Logger } = require("./logger.js");
const { FileStorage } = require("./fileStorage.js");
// const { ReportGenerator } = require("./reportGenerator.js");

class IpcHandler {
  constructor(mainWindow) {
    // setup local fileStorage
    this.logger = new Logger(mainWindow);
    this.connectionHandler = new ConnectionHandler(this.logger);
    this.fileStorage = new FileStorage();
    // this.reportGenerator = new ReportGenerator(this.fileStorage);
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
    // ipcMain.handle("start-test", (event, route) => {
    //   return this.connectionHandler.startTest();
    // });
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
    ipcMain.handle("still-connected", (event, route) => {
      return this.connectionHandler.sendCommand("still connected");
    });
    ipcMain.handle("disconnect", (event, route) => {
      return this.connectionHandler.disconnect();
    });
    ipcMain.handle("tare", (event, route) => {
      return this.connectionHandler.tare();
    });
    // ipcMain.handle("start-collecting-weight", (event, route) => {
    //   return this.connectionHandler.startReceivingData();
    // });
    // ipcMain.handle("stop-collecting-weight", (event, route) => {
    //   return this.connectionHandler.stopReceivingData();
    // });
    ipcMain.handle("calibrate", (event, value) => {
      return this.connectionHandler.calibrate(value);
    });
    ipcMain.handle("get-chart-data", (event, route) => {
      return this.connectionHandler.getData();
    });
    ipcMain.handle("save-file", (event, data) => {
      return this.fileStorage.saveFile(data);
    });
    ipcMain.handle("select-file", (event) => {
      return this.fileStorage.selectFile();
    });
    ipcMain.handle("get-file", (event,data) => {
      return this.fileStorage.getFile(data);
    });
    ipcMain.handle("open-results-dir", (event) => {
      return this.fileStorage.openResultsDir();
    });
    // ipcMain.handle("generate-report", (event, data) => {
    //   return this.reportGenerator.generatePdf(data);
    // });
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
