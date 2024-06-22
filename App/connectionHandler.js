const { SerialPort } = require("serialport");
const tableify = require("tableify");
const app = require("electron").app;
class ConnectionHandler {
  constructor() {
    this.ports = [];
    this.openPorts = [];
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
    console.log("here");
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
      console.log("opening port", this.smartScalePort.path);
      try {
        this.sp = new SerialPort({
          path: this.smartScalePort.path,
          baudRate: 9600,
        });
      } catch (err) {
        if (err.message.includes("Access denied")) {
          console.log("Port already open");
        }
      }
      this.sp.on("open", () => {
        this.sendCommand("connect");
      });

      this.sp.on("data", (data) => {
        // check if port belongs to Smart-Scale
        console.log(data.toString());
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
        this.sp.write("master:disconnect:retsam\n");
      });
      return true;
    } catch (err) {
      console.error(err);
      return err;
    }
  }
  handleData(data) {
    const strData = data.toString();
    const dataArr = strData.split(":");
    if (dataArr.length === 2) {
      this.xData.push(dataArr[0]);
      this.yData.push(dataArr[1]);
    }
  }

  async connectSmartScale() {
    try {
      await this.findScalePort();
      if (await this.areThereAnyBluetoothPorts()) {
        console.log("Bluetooth ports found");
        if (this.smartScalePort !== undefined) {
          console.log("connecting to Smart-Scale", this.smartScalePort?.path);
          if (this.sp?.isOpen) {
            this.sendCommand("connect");
            return "Connected";
            // biome-ignore lint/style/noUselessElse: <explanation>
          } else {
            const portOpen = await this.openPort();
            return portOpen ? "Connected" : "Error";
          }
          // console.log(portOpen);
        }
        throw new Error("smart scale port undefined");
      }
      throw new Error("No Bluetooth ports found");
    } catch (err) {
      console.error(err);
      return err;
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
    this.smartScalePort.write(
      "master:start sending weights:retmas\n",
      (err) => {
        if (err) {
          console.error(
            "Error writing to port:",
            this.smartScalePort.path,
            err.message
          );
          return false;
        }
      }
    );
  }
  sendCommand(command) {
    this.sp.write(`master:${command}:retsam\n`, (err) => {
      if (err) {
        console.error("Error writing to port:", this.smartScalePort.path, err);
      }
    });
  }
  getData() {
    return { x: this.xData, y: this.yData };
  }
}

module.exports = { ConnectionHandler };
