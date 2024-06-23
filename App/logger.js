const { ipcMain } = require("electron");
class Logger {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.debug = false;
    this.init();
  }
  init() {
    // IPC listener for log messages
    ipcMain.on("log-message", (event, { level, message }) => {
      this.log(level, message);
    });
  }
  log(message, level = "info") {
    if (message && message !== "") {
      // this.logger.log({ level, message });
      this.mainWindow.webContents.send(
        "log-message",
        `${new Date().toISOString()} [${level}]: ${message}`
      );
      this.debug
        ? console.log(`${new Date().toISOString()} [${level}]: ${message}`)
        : null;
    }
  }
  error(message) {
    this.log(message, "error");
  }
  info(message) {
    this.log(message, "info");
  }
  warn(message) {
    this.log(message, "warn");
  }
  debug(message) {
    this.log(message, "debug");
  }
  verbose(message) {
    this.log(message, "verbose");
  }
}

module.exports = { Logger };
