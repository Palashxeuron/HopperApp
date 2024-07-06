const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");

class FileStorage {
  constructor() {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      "userData"
    );
    this.dataDir = path.join(userDataPath, "Hopper_AppData");
    console.log("Hopper_AppData Directory: ", this.dataDir);
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir);
    }
  }

  saveFile(dataJson) {
    const filename = dataJson.filename;
    console.log("Saving data to file: ", filename);
    console.log("Data: ", dataJson);
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      // save the data to the file
      fs.writeFileSync(filePath, JSON.stringify(dataJson));
    } catch (error) {
      console.error(`Error writing data to "${filename}": ${error.message}`);
    }
  }
  getFile(filename) {
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
      }
    } catch (error) {
      console.error(`Error reading data from "${filename}": ${error.message}`);
    }
    return null;
  }
}

module.exports = { FileStorage };
