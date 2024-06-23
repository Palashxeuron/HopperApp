const { createLogger, format, transports } = require("winston");
const { ipcMain } = require("electron");
class Logger {
  constructor(mainWindow) {
    // Create a logger
    this.logger = createLogger({
      level: "info",
      format: format.combine(
        format.timestamp(),
        format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} [${level}]: ${message}`
        )
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: "app.log" }),
      ],
    });
    this.mainWindow = mainWindow;
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
      this.logger.log({ level, message });
      this.mainWindow.webContents.send(
        "log-message",
        `${new Date().toISOString()} [${level}]: ${message}`
      );
    }
  }
}
// const logger = createLogger({
//   level: "info",
//   format: format.combine(
//     format.timestamp(),
//     format.printf(
//       ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
//     )
//   ),
//   transports: [
//     new transports.Console(),
//     new transports.File({ filename: "app.log" }),
//   ],
// });
// // Function to log messages and send them to renderer
// function log(level, message) {
//   logger.log({ level, message });
//   mainWindow.webContents.send(
//     "log-message",
//     `${new Date().toISOString()} [${level}]: ${message}`
//   );
// }

module.exports = { Logger };
