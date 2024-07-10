const electron = require("electron");
const { app, ipcMain, dialog } = require("electron");
const fs = require("node:fs");
const { type } = require("node:os");
const path = require("node:path");

class FileStorage {
  constructor() {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      "userData"
    );
    this.dataDir = path.join(userDataPath, "Hopper_AppData");
    // console.log("Hopper_AppData Directory: ", this.dataDir);
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir);
    }
  }
  selectFile() {
    const options = {
      
      title: "Select a file to open",
      properties: ["openFile"],
      // only allow to select single file
      multiSelections: false,
      defaultPath: this.dataDir,
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    };
    return dialog.showOpenDialogSync(options);
  }
  saveFile(dataJson) {
    const filename = dataJson.filename;
    let filePath = path.join(this.dataDir, `${filename}.json`);
    // console.log("Saving data to file: ", filename);
    // console.log("Data: ", dataJson);
    // check if datajson has key chainLength
    if (dataJson.test === "hopperTrial") {
      const N = dataJson.chainLength;
      const angle = dataJson.angle.replace(/\./g, "_");
      const width = dataJson.width.replace(/\./g, "_");
      const saveDir = path.join(
        this.dataDir,
        `N${N}`,
        `Angle_${angle}`,
        `Width_${width}`
      );
      filePath = path.join(saveDir, `${filename}.json`);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
    }
    try {
      // save the data to the file
      fs.writeFileSync(filePath, JSON.stringify(dataJson));
    } catch (error) {
      console.error(`Error writing data to "${filename}": ${error.message}`);
    }
  }
  getFile(filePath_) {
    try {
      // const filePath = path.join(this.dataDir, `${filename}.json`);
      const filePath = filePath_[0];
      console.log("Reading data from file: ", filePath, typeof filePath);
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
      }
        console.log("File does not exist: ", filePath);
    } catch (error) {
      console.error(`Error reading data from "${filename}": ${error.message}`);
    }
    return null;
  }
  openResultsDir() {
    console.log("Opening results directory: ", this.dataDir);
    electron.shell.openPath(this.dataDir);
  }
}

module.exports = { FileStorage };
