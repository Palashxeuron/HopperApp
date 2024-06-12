const { SerialPort } = require("serialport");
const tableify = require("tableify");

class ConnectionHandler {
  constructor() {
    this.ports = [];
    this.openPorts = [];
    this.tableHTML = "";
    this.init();
    this.smartScalePort = undefined;
  }
  init() {
    this.listSerialPorts();
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

  // function to open each port and send a message and log the response
  checkPorts() {
    console.log(this.smartScalePort ? this.smartScalePort.path : "no port yet");
    SerialPort.list()
      .then((ports, err) => {
        if (err) {
          console.error(err);
          return;
        }
        ports.forEach(async (port) => {
          // check if manufacturer is "Microsoft" and friendlyName contains "Bluetooth"
          if (
            port.manufacturer &&
            port.manufacturer.includes("Microsoft") &&
            port.pnpId.includes("BTHENUM")
          ) {
            //   console.log("found bluetooth port", port);
            await this.checkPort(port);
            if (this.smartScalePort !== undefined) {
              console.log("connecting to Smart-Scale");
              this.closeAllPorts();
              this.connectSmartScale();
              return;
            }
          }
        });
      })
      .catch((err) => {
        console.error("Error listing ports:", err);
      });
  }
  async checkPort(port) {
    return new Promise((resolve) => {
      console.log("opening port", port.path);
      const sp = new SerialPort({ path: port.path, baudRate: 9600 });
      this.openPorts.push(sp);
      sp.on("open", () => {
        console.log("port opened");
        sp.write("master:Are you Smart-Scale:retsam\n", (err) => {
          if (err) {
            console.error("Error writing to port", port.path, ":", err.message);
            resolve();
          }
        });
      });

      sp.on("data", (data) => {
        // check if port belongs to Smart-Scale
        if (data.toString().includes("Yes, I am Smart-Scale")) {
          this.smartScalePort = port;
          console.log("Smart-Scale found", port.path);
          resolve();
        }
      });

      sp.on("error", (err) => {
        console.error("Error on port", port.path, ":", err.message);
        resolve();
      });
    });
  }
  async openPort(port) {
    return new Promise((resolve) => {
      console.log("opening port", port.path);
      const sp = new SerialPort({ path: port.path, baudRate: 9600 });
      this.openPorts.push(sp);
      sp.on("open", () => {
        console.log("port opened", port.path);
      });

      sp.on("data", (data) => {
        // check if port belongs to Smart-Scale
        console.log(data.toString());
      });

      sp.on("error", (err) => {
        console.error("Error on port", port.path, ":", err.message);
        resolve();
      });
    });
  }
  //  function that log all open ports
  closeAllPorts() {
    this.openPorts.forEach((port) => {
      port.close((err) => {
        if (err) {
          console.error("Error closing port", port.path, ":", err.message);
        }
      });
    });
    console.log("all ports closed");
    this.openPorts = [];
  }
  connectSmartScale() {
    console.log("connecting to Smart-Scale", this.smartScalePort.path);
    this.openPort(this.smartScalePort);
  }
}

module.exports = { ConnectionHandler };
