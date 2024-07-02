class HomePage {
  constructor(rightBarItems, bottomBarItems, logger, calibrationPopup) {
    this.rightBarItems = rightBarItems;
    this.bottomBarItems = bottomBarItems;
    this.bottomBar = new BottomBar(this);
    this.rightBar = new RightBar(this);
    this.logger = logger;
    this.calibrationPanel = calibrationPopup;
    this.create();
  }
  create() {
    this.bottomBar.create();
    this.rightBar.create();
    this.logger.init();
  }
}
class BottomBar {
  constructor(homePage) {
    this.parent = homePage;
    this.items = this.parent.bottomBarItems;
  }
  create() {
    // biome-ignore lint/complexity/noForEach: <explanation>
    this.items.forEach((item) => {
      const button = new BarItem(item, this.parent).create();
      document.getElementById("bottom-bar").appendChild(button);
      item.onCreate();
    });
  }
}
class RightBar {
  constructor(homePage) {
    this.parent = homePage;
    this.items = this.parent.rightBarItems;
  }
  create() {
    // biome-ignore lint/complexity/noForEach: <explanation>
    this.items.forEach((item) => {
      const button = new BarItem(item, this.parent).create();
      document.getElementById("right-bar").appendChild(button);
    });
  }
}
class BarItem {
  constructor(item, homePage) {
    this.item = item;
    this.parent = homePage;
    this.popup = null;
  }
  create() {
    const button = document.createElement("button");
    button.className = "sidebar-button";
    button.id = this.item.id;
    if (this.item.type === "popup") {
      this.popup = new Popup(this.item.popup, this.parent);
      button.onclick = () => this.togglePopup();
    }
    if (this.item.type === "button") {
      button.onclick = this.item.onClick;
    }
    button.innerHTML = this.item.placeholder;
    return button;
  }
  togglePopup() {
    this.popup.isOpen ? this.popup.closePopup() : this.popup.openPopup();
  }
}
class Popup {
  constructor(popupJson, homePage) {
    this.parent = homePage;
    this.popupItem = popupJson;
    this.popup = null;
    this.create();
  }
  async create() {
    this.popup = document.createElement("div");
    this.popup.id = this.popupItem.id;
    this.popup.className = "popup";

    const popupContent = document.createElement("div");
    popupContent.className = "popup-content";

    const close = document.createElement("span");
    close.className = "close";
    close.innerHTML = "&times;";
    close.onclick = () => this.closePopup();

    const title = document.createElement("h2");
    title.innerHTML = this.popupItem.title;

    const content = document.createElement("p");

    popupContent.appendChild(close);
    popupContent.appendChild(title);
    popupContent.appendChild(content);

    this.popup.appendChild(popupContent);

    document.getElementById("popups").appendChild(this.popup); // append to popups

    if (this.popupItem.onCreate) {
      await this.popupItem.onCreate();
    }
  }
  openPopup(id = this.popupItem.id) {
    this.isOpen = true;
    this.popupItem.onOpen();
    document.getElementById(id).style.display = "block";
  }

  closePopup(id = this.popupItem.id) {
    this.isOpen = false;
    document.getElementById(id).style.display = "none";
    this.popupItem.onClose();
  }
}
class ComPortTable {
  async create() {
    // <div id="error"></div>
    // <div id="ports"></div>
    const container = document.createElement("div");
    container.id = "comPorts_container";
    const error = document.createElement("div");
    error.id = "port_error";
    const ports = document.createElement("div");
    ports.id = "ports";
    this.update();
    container.appendChild(error);
    container.appendChild(ports);
    return container;
  }
  async update() {
    const response = await bt.listPorts();
    // console.log("response", response);
    if (response.ports.length === 0) {
      document.getElementById("port_error").textContent = "No ports discovered";
    }

    document.getElementById("ports").innerHTML = response.html;
  }
}
class SettingsPanel {
  constructor() {
    this.popupId = "settings";
    this.ports = []; //bt.listPorts();
    this.portsPath = []; //this.ports.map((port) => port.path);
    this.selectedPort = "";
    this.savePath = "";
    this.init();
    this.initDone = this.init();
  }
  isReady() {
    return this.initDone;
  }
  async init() {
    const response = await bt.listPorts();
    this.ports = response.ports;
    // console.log("ports", this.ports);
    this.portsPath = this.ports.map((port) => port.path);
    this.selectedPort = this.portsPath[0];
  }
  // create settings panel that let user select port from a dropdown and select save path opening a file dialog
  async create() {
    // make sure init is done with isReady
    await this.isReady();
    const settingsPanel = document.createElement("div");
    settingsPanel.id = "settings-panel";

    // Create port selection dropdown
    const portLabel = document.createElement("label");
    portLabel.innerHTML = "Select Port:";
    const portDropdown = document.createElement("select");
    portDropdown.id = "port-dropdown";
    // Add options to the dropdown based on available ports
    for (const port of this.portsPath) {
      const option = document.createElement("option");
      option.value = port;
      option.innerHTML = port;
      portDropdown.appendChild(option);
    }

    portLabel.appendChild(portDropdown);

    // Create save path input and file dialog button
    const savePathLabel = document.createElement("label");
    savePathLabel.innerHTML = "Save Path:";
    const savePathInput = document.createElement("input");
    savePathInput.type = "text";
    savePathInput.id = "save-path-input";
    const fileDialogButton = document.createElement("button");
    fileDialogButton.innerHTML = "Open File Dialog";
    fileDialogButton.id = "file-dialog-button";
    savePathLabel.appendChild(savePathInput);
    savePathLabel.appendChild(fileDialogButton);

    // Create save settings button
    const saveSettingsButton = document.createElement("button");
    saveSettingsButton.innerHTML = "Save Settings";
    saveSettingsButton.id = "save-settings-button";

    // Append all elements to the settings panel
    settingsPanel.appendChild(portLabel);
    settingsPanel.appendChild(savePathLabel);
    settingsPanel.appendChild(saveSettingsButton);
    document
      .querySelector("#settingsPopup .popup-content")
      .appendChild(settingsPanel);
    this.afterCreate();
  }
  afterCreate() {
    // add listener to dropdown to update selected port
    const portDropdown = document.getElementById("port-dropdown");
    portDropdown.addEventListener("change", (e) => {
      this.selectedPort = e.target.value;
      console.log("selected port", this.selectedPort);
    });
    const fileDialogButton = document.getElementById("file-dialog-button");
    fileDialogButton.onclick = async () => {
      const savePathInput = document.getElementById("save-path-input");
      // Open file dialog and set the selected path to the input value
      const selectedPath = await bt.getLocalPath();
      savePathInput.value = selectedPath;
    };
    const saveSettingsButton = document.getElementById("save-settings-button");
    saveSettingsButton.onclick = () => {
      const savePathInput = document.getElementById("save-path-input");
      const selectedPort = portDropdown.value;
      const selectedSavePath = savePathInput.value;
      // Save the selected port and save path to the settings
      this.selectedPort = selectedPort;
      this.savePath = selectedSavePath;
      this.closePopup();
    };
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
}
class ChartClass {
  constructor() {
    this.div = document.getElementById("chart");
    this.canvas = document.getElementById("myChart");
    this.chartUpdateInterval = 5000;
    this.init();
  }
  async init() {
    await this.getChartData();
    // create chart with chart.js
    const ctx = this.canvas.getContext("2d");
    this.myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.xData,
        datasets: [
          {
            label: "Rate of Mass",
            data: this.yData,
            backgroundColor: ["rgba(255, 99, 132, 0.2)"],
            borderColor: ["rgba(255, 99, 132, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
    this.update();
  }
  async update() {
    console.log("updating chart");
    // get x and y data
    await this.getChartData();
    // update chart
    this.myChart.data.labels = this.xData;
    this.myChart.data.datasets[0].data = this.yData;
    setTimeout(this.update.bind(this), this.chartUpdateInterval);
  }
  async getChartData() {
    bt.getChartData().then((data) => {
      this.xData = data.x;
      this.yData = data.y;
    });
  }
}
class LoggerClass {
  constructor() {
    this.logs = ["logger initialized"];
    this.init();
  }
  init() {
    this.popupContent = document.querySelector("#logsPopup .popup-content");
    this.logsContainer = document.getElementById("logsContainer");
    this.connectButton = document.querySelector(
      "button#connect.sidebar-button"
    );
    this.disconnectButton = document.querySelector(
      "button#disconnect.sidebar-button"
    );
    // console.log("connectButton", this.connectButton);
    this.setupLogger();
  }
  setupLogger() {
    if (this.listenerAdded) {
      return;
    }
    // Listen for log messages from the main process
    logger.onLogMessage((message) => {
      if (message && message.length > 0) {
        this.logs.push(message);
        this.handleLogMessage();
        this.render();
      }
    });
    this.listenerAdded = true;
  }
  handleLogMessage() {
    const message = this.logs[this.logs.length - 1];
    // console.log("message", message);
    if (message.includes("WEIGHT:")) {
      // extract weight and time from message sent as
      // String str = "WEIGHT: " + String(sensorRead) + " g" + ";TIME: " + String(millis()) + " ms";
      const weight = message.split("WEIGHT: ")[1].split(" g")[0];
      const time = message.split("TIME: ")[1].split(" ms")[0];
      console.log("weight", weight);
      console.log("time", time);
    }
    if (message.includes("ACK: connect")) {
      // do something
      console.log("connected");
      this.connectButton.style.backgroundColor = "green";
      this.disconnectButton.style.backgroundColor = "red";
    }
    if (message.includes("Port closed")) {
      // do something
      console.log("dis-connected");
      this.connectButton.style.backgroundColor = "red";
      this.disconnectButton.style.backgroundColor = "green";
    }
    if (message.includes("ACK: calibration done")) {
      // get calibration factor from "ACK: calibration done, calibration factor: " + String(calibrationFactor)
      const calibrationFactor = message.split(
        "ACK: calibration done, calibration factor: "
      )[1];
      console.log("calibration factor", calibrationFactor);
    }
    if (message.includes("ACK: tarred")) {
      console.log("tare done");
    }
  }
  onCreate() {
    const logsContainer = document.createElement("div");
    logsContainer.id = "logsContainer";
    document
      .querySelector("#logsPopup .popup-content")
      .appendChild(logsContainer);
    // console.log(document.querySelector("#logsPopup .popup-content"));
    this.logsContainer = logsContainer;
  }
  async render() {
    this.logsContainer.innerHTML = "";
    // biome-ignore lint/complexity/noForEach: <explanation>
    this.logs.forEach((log) => {
      const p = document.createElement("p");
      p.textContent = log;
      this.logsContainer.appendChild(p);
    });
  }
  dispose() {
    // remove all <p> elements from popupContent
    this.popupContent.innerHTML = "";
  }
}
class CalibrationPopup {
  constructor() {
    this.popupId = "calibrationPopup";
    this.init();
    this.initDone = this.init();
  }
  isReady() {
    return this.initDone;
  }
  async init() {}
  // create settings panel that let user select port from a dropdown and select save path opening a file dialog
  async create() {
    // make sure init is done with isReady
    await this.isReady();
    const calibrationPanel = document.createElement("div");
    calibrationPanel.id = "calibration-panel";

    // Create title
    const title = document.createElement("h2");
    title.innerHTML = "Calibrate Scale";

    // Create instruction label
    const instructionLabel1 = document.createElement("label");
    instructionLabel1.innerHTML =
      "Put some known weight on the scale and enter it below in grams.";

    // Create input wrapper
    const weightInputWrapper = document.createElement("div");
    weightInputWrapper.style.display = "flex";
    weightInputWrapper.style.alignItems = "center";

    // Create input for weight
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.id = "weight-input";
    weightInput.style.marginRight = "5px"; // Space between input and text

    // Create text for units
    const unitText = document.createElement("span");
    unitText.innerHTML = "gms";

    // Append input and unit text to wrapper
    weightInputWrapper.appendChild(weightInput);
    weightInputWrapper.appendChild(unitText);

    // Create warning message
    const warningMessage = document.createElement("p");
    warningMessage.id = "warning-message";
    warningMessage.style.color = "red";
    warningMessage.style.display = "none";
    warningMessage.innerHTML = "Please enter a valid number.";

    // Add event listener to weight input to show warning if input is invalid
    weightInput.addEventListener("input", () => {
      if (isNaN(weightInput.value) || weightInput.value.trim() === "") {
        warningMessage.style.display = "block";
      } else {
        warningMessage.style.display = "none";
      }
    });

    // Create second instruction label
    const instructionLabel2 = document.createElement("label");
    instructionLabel2.innerHTML = "Press Calibrate to calibrate scale now.";

    // Create calibrate button
    const calibrateButton = document.createElement("button");
    calibrateButton.innerHTML = "Calibrate";
    calibrateButton.id = "calibrate-button";

    // Append all elements to the calibration panel
    // calibrationPanel.appendChild(title);
    calibrationPanel.appendChild(instructionLabel1);
    calibrationPanel.appendChild(warningMessage);
    calibrationPanel.appendChild(weightInputWrapper);
    calibrationPanel.appendChild(instructionLabel2);
    calibrationPanel.appendChild(calibrateButton);
    document
      .querySelector("#calibrationPopup .popup-content")
      .appendChild(calibrationPanel);
    this.afterCreate();
  }

  afterCreate() {
    this.calibrateButton = document.querySelector("#calibrate-button");
    this.calibrateButton.onclick = async () => {
      const weight = this.readWeight();
      bt.calibrate(weight);
    };
  }
  readWeight() {
    const weightInput = document.getElementById("weight-input");
    return weightInput.value;
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
}
export {
  HomePage,
  BottomBar,
  RightBar,
  BarItem,
  Popup,
  ComPortTable,
  SettingsPanel,
  ChartClass,
  LoggerClass,
  CalibrationPopup,
};
