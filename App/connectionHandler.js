const { SerialPort } = require("serialport");
const tableify = require("tableify");
const app = require("electron").app;
class ConnectionHandler {
  constructor(logger) {
    this.logger = logger;
    this.ports = [];
    this.openPorts = [];
    this.xData = [];
    this.yData = [];
    this.tableHTML = "";
    this.init();
    this.smartScalePort = undefined;
    this.sp = undefined;
    this.isPaired = false;
    this.exp32UID = "&4022D8EADB3E";
  }
  async init() {
    await this.listSerialPorts();
    await this.findScalePort();
  }
  async listSerialPorts() {
    try {
      this.ports = await SerialPort.list();
      //   console.log("ports", this.ports);
      if (this.ports.length === 0) {
        this.tableHTML = "No ports discovered";
      } else {
        this.tableHTML = tableify(this.ports);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  async findScalePort() {
    try {
      this.ports = await SerialPort.list();

      for (const port of this.ports) {
        // check if manufacturer is "Microsoft" and friendlyName contains "Bluetooth"
        if (
          port.manufacturer?.includes("Microsoft") &&
          port.pnpId.includes("BTHENUM") &&
          port.pnpId.includes(this.exp32UID)
        ) {
          this.isPaired = true;
          this.smartScalePort = port;
          console.log("Smart-Scale is PAIRED");
          console.log("Smart-Scale found", this.smartScalePort.path);
        } else {
          this.isPaired = false;
          console.log("Smart-Scale is NOT PAIRED");
        }
      }
    } catch (err) {
      console.error("Error finding scale port:", err);
      return `Error finding scale port: ${err}`;
    }
  }
  async openPort() {
    try {
      this.logger.log(`opening port ${this.smartScalePort.path}`);

      this.sp = new SerialPort({
        path: this.smartScalePort.path,
        baudRate: 9600,
      });

      this.sp.on("open", () => {
        this.sendCommand("connect");
      });

      this.sp.on("data", (data) => {
        // check if port belongs to Smart-Scale
        this.logger.log(data.toString());
        this.handleData(data);
      });

      this.sp.on("error", (err) => {
        console.error(
          "Error on port",
          this.smartScalePort.path,
          ":",
          err.message
        );
        return false;
      });
      app.on("before-quit", () => {
        this.sendCommand("disconnect");
      });
    } catch (err) {
      console.error(err);
    }
  }
  handleData(data) {
    const strData = data.toString();
    const dataArr = strData.split(":");
    if (dataArr.length === 2) {
      // this.xData.push(dataArr[0]);
      // this.yData.push(dataArr[1]);
    }
  }

  async connectSmartScale() {
    try {
      await this.findScalePort();
      if (this.isPaired && this.smartScalePort !== undefined) {
        console.log("connecting to Smart-Scale at", this.smartScalePort?.path);
        if (this.sp?.isOpen) {
          console.log("Port already open");
          this.sendCommand("connect");
        } else {
          await this.openPort();
        }
      } else {
        console.error("smart scale port undefined");
      }
    } catch (err) {
      console.error(err);
    }
  }
  async areThereAnyBluetoothPorts() {
    await this.listSerialPorts();
    const present = this.ports.some((port) => {
      return (
        port.manufacturer?.includes("Microsoft") &&
        port.pnpId.includes("BTHENUM")
      );
    });
    return present;
  }
  async startTest() {
    this.sendCommand("start sending weight");
  }
  sendCommand(command, callback = () => {}) {
    try {
      if (this.sp === undefined) {
        console.error("smart scale port not defined");
        return;
      }
      if (!this.sp.isOpen) {
        console.error("Port is not open");
        return;
      }
      this.sp.write(`master:${command}:retsam\n`, (err) => {
        if (err) {
          console.error(
            "Error writing to port:",
            this.smartScalePort.path,
            err
          );
        }
      });
      this.sp.once("data", (data) => {
        console.log("data", data.toString());
        callback(data.toString());
      });
    } catch (err) {
      console.error("Error sending command:", err);
    }
  }
  tare() {
    this.sendCommand("tare");
  }
  getData() {
    return { x: this.xData, y: this.yData };
  }
}

module.exports = { ConnectionHandler };
