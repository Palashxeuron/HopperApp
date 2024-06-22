const { createLogger, format, transports } = require("winston");
const { ipcMain } = require("electron");
// Create a logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});
// Function to log messages and send them to renderer
function log(level, message) {
  logger.log({ level, message });
  mainWindow.webContents.send(
    "log-message",
    `${new Date().toISOString()} [${level}]: ${message}`
  );
}

// IPC listener for log messages
ipcMain.on("log-message", (event, { level, message }) => {
  log(level, message);
});
