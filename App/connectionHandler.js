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
    this.retry = 0;
    this.maxRetry = 1;
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
  async checkPorts() {
    this.checkingPorts = true;
    // console.log(this.smartScalePort ? this.smartScalePort.path : "no port yet");
    try {
      this.ports = await SerialPort.list();

      for (const port of this.ports) {
        // check if manufacturer is "Microsoft" and friendlyName contains "Bluetooth"
        if (
          port.manufacturer?.includes("Microsoft") &&
          port.pnpId.includes("BTHENUM") &&
          port.pnpId.includes("&4022D8EADB3E")
        ) {
          // await this.checkPort(port);
          this.smartScalePort = port;
        }
      }
    } catch (err) {
      console.error("Error listing ports:", err);
      return `Error listing ports: ${err}`;
    } finally {
      this.checkingPorts = false;
    }
  }
  // checkPort(port) {
  //   return new Promise((resolve) => {
  //     let portChecked = false;
  //     const sp = new SerialPort({ path: port.path, baudRate: 9600 });

  //     this.openPorts.push(sp);

  //     sp.on("open", () => {
  //       console.log("Port opened:", port.path);
  //       sp.on("data", (data) => {
  //         const response = data.toString();
  //         if (response.includes("Yes, I am Smart-Scale")) {
  //           this.smartScalePort = port;
  //           console.log("Smart-Scale found:", port.path);
  //         } else {
  //           console.log("Not Smart-Scale:", port.path, response);
  //         }
  //         portChecked = true;
  //         closePort();
  //       });

  //       sp.on("error", (err) => {
  //         console.error("Error on port:", port.path, err.message);
  //         portChecked = true;
  //         closePort();
  //       });
  //     });
  //     app.on("before-quit", () => {
  //       sp.write("master:disconnect:retsam\n");
  //     });
  //     sp.write("master:Are you Smart-Scale:retsam\n", (err) => {
  //       if (err) {
  //         console.error("Error writing to port:", port.path, err.message);
  //         closePort();
  //       }
  //     });

  //     const closePort = () => {
  //       resolve();
  //     };
  //     setTimeout(() => {
  //       if (!portChecked) {
  //         closePort();
  //       }
  //     }, 5000);
  //   });
  // }
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
        this.sp.write("master:connect:retmas\n", (err) => {
          if (err) {
            console.error(
              "Error writing to port:",
              this.smartScalePort.path,
              err.message
            );
            return false;
          }
        });
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
      await this.checkPorts();
      if (await this.areThereAnyBluetoothPorts()) {
        console.log("Bluetooth ports found");
        if (this.smartScalePort !== undefined) {
          console.log("connecting to Smart-Scale", this.smartScalePort?.path);
          const portOpen = await this.openPort();
          return portOpen ? "Connected" : "Error";
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
  getData() {
    return { x: this.xData, y: this.yData };
  }
}

module.exports = { ConnectionHandler };
