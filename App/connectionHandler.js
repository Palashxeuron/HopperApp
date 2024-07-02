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
    await this.connectSmartScale();
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
        // console.log(port.pnpId.includes("BTHENUM"));
        // console.log(port.pnpId.includes(this.exp32UID));

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
          return;
        }
        this.isPaired = false;
        console.log("Smart-Scale is NOT PAIRED");
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
      });
      this.sp.on("close", () => {
        console.log("Port closed");
        this.logger.log("Port closed");
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
      console.error("error opening port", err);
    }
  }
  async connectSmartScale() {
    try {
      await this.findScalePort();
      if (this.isPaired && this.smartScalePort !== undefined) {
        console.log("connecting to Smart-Scale at", this.smartScalePort?.path);
        if (this.sp?.isOpen) {
          this.disconnect();
          console.log("Port already open so closed it first");
        }
        await this.openPort();
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
  disconnect() {
    this.sp.close((err) => {
      console.log("port closed", err);
    });
    this.sp = undefined;
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
        // console.log("data", data.toString());
        callback(data.toString());
      });
    } catch (err) {
      console.error("Error sending command:", err);
    }
  }
  tare() {
    console.log("taring");
    this.sendCommand("tare");
  }
  calibrate(knownWeight) {
    console.log("calibrating with weight", knownWeight);
    this.sendCommand(`calibrate:${knownWeight}`);
  }
  getData() {
    return { x: this.xData, y: this.yData };
  }
  startReceivingData() {
    console.log("asking to start sending weights");
    this.sendCommand("start sending weights");
  }
  stopReceivingData() {
    console.log("asking to stop sending weights");
    this.sendCommand("stop sending weights");
  }
}

module.exports = { ConnectionHandler };
