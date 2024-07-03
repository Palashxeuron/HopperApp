class App {
  constructor() {
    this.logger = new LoggerClass(this);
    this.settings = new SettingsPanel(this);
    this.creepTestPanel = new CreepTestPanel(this);
    this.calibrationPopup = new CalibrationPopup(this);
    this.chart = new ChartClass(this);
    this.stillConnected = false;
    this.connectionCheckLoop = null;
    this.bottomBarItems = [
      {
        id: "paired",
        placeholder: "Paired",
        onHover: "Paired to Smart-Scale",
        type: "button",
        onCreate: async () => {
          bt.isPaired().then((response) => {
            // console.log("response", response);
            if (response.isPaired) {
              logger.logMessage(
                `Paired to Smart-Scale at port: 
                ${response.smartScalePort.path}`
              );
              // make connect button green
              document.getElementById("paired").style.backgroundColor = "green";
            } else {
              document.getElementById("paired").style.backgroundColor = "red";
              // disable connect button
            }
          });
        },
        onClick: async () => {
          bt.isPaired().then((response) => {
            // console.log("response", response);
            if (response.isPaired) {
              logger.logMessage(
                `Paired to Smart-Scale at port: 
                ${response.smartScalePort.path}`
              );
              // make paired button green
              document.getElementById("paired").style.backgroundColor = "green";
            } else {
              document.getElementById("paired").style.backgroundColor = "red";
            }
          });
        },
        position: 1,
      },
      {
        id: "connect",
        placeholder: "Connect",
        onHover: "Connect to Smart-Scale",
        type: "button",
        onClick: async () => {
          if ("bluetooth" in navigator) {
            console.log("This device supports Bluetooth");
            bt.connectSmartScale();
          } else {
            console.log("This device does not support Bluetooth");
            document.getElementById("connect").style.backgroundColor = "red";
          }
        },
        onCreate: async () => {},
        position: 1,
      },
      {
        id: "disconnect",
        placeholder: "Disconnect",
        onHover: "Disconnect Smart-Scale",
        type: "button",
        onClick: async () => {
          bt.disconnect();
        },
        onCreate: async () => {},
        position: 1,
      },
    ];
    this.rightBarItems = [
      {
        id: "logs",
        placeholder: "Logs",
        onHover: "Open Logs",
        type: "popup",
        popup: {
          id: "logsPopup",
          title: "Logs",
          onClose: () => {},
          onOpen: async () => {
            await this.logger.render();
          },
          onCreate: async () => {
            this.logger.onCreate();
          },
        },
        position: 1,
      },
      {
        id: "settings",
        placeholder: "Settings",
        onHover: "Open Settings",
        type: "popup",
        popup: {
          id: "settingsPopup",
          title: "Settings",
          onClose: () => {},
          onOpen: async () => {},
          onCreate: async () => {
            await this.settings.create();
          },
        },
        position: 2,
      },
      {
        id: "coms",
        placeholder: "COM ports",
        onHover: "Show COM ports",
        type: "popup",
        popup: {
          id: "comsPopup",
          title: "COM ports",
          onOpen: () => {},
          onClose: () => {},
          onCreate: async () => {
            const comPortTable = new ComPortTable();
            const container = await comPortTable.create();
            document
              .querySelector("#comsPopup .popup-content")
              .appendChild(container);
            // return container.outerHTML;
          },
        },
        position: 3,
      },
      {
        id: "tare",
        placeholder: "Tare",
        onHover: "Tare",
        type: "button",
        onClick: async () => {
          bt.tare();
        },
        onCreate: async () => {},
        position: 2,
      },
      {
        id: "calibrate",
        placeholder: "Calibrate",
        onHover: "Calibrate",
        type: "popup",
        popup: {
          id: "calibrationPopup",
          title: "Calibrate Scale",
          onOpen: () => {},
          onClose: () => {},
          onCreate: async () => {
            this.calibrationPopup.create();
          },
        },
        position: 2,
      },
      {
        id: "start",
        placeholder: "Start",
        onHover: "Start test",
        type: "button",
        onClick: async () => {
          bt.startCollectingWeight();
        },
        onCreate: async () => {},
        position: 2,
      },
      {
        id: "stop",
        placeholder: "Stop",
        onHover: "Stop test",
        type: "button",
        onClick: async () => {
          bt.stopCollectingWeight();
        },
        onCreate: async () => {},
        position: 2,
      },
      {
        id: "creepTest",
        placeholder: "Creep Test",
        onHover: "Creep test",
        type: "popup",
        popup: {
          id: "creepTestPopup",
          title: "Creep Test",
          onClose: () => {},
          onOpen: async () => {},
          onCreate: async () => {
            await this.creepTestPanel.create();
          },
        },
        position: 2,
      },
      {
        id: "hysteresisTest",
        placeholder: "Hysteresis Test",
        onHover: "Hysteresis test",
        type: "button",
        onClick: async () => {
          bt.startCreepTest();
        },
        onCreate: async () => {},
        position: 2,
      },
      {
        id: "about",
        placeholder: "About",
        onHover: "Open About",
        type: "popup",
        popup: {
          id: "aboutPopup",
          title: "About",
          onClose: () => {},
          onOpen: async () => {},
          onCreate: async () => {
            const container = this.getAboutContent();
            document
              .querySelector("#aboutPopup .popup-content")
              .appendChild(container);
          },
        },
        position: 10,
      },
    ];
    this.bottomBar = new BottomBar(this);
    this.rightBar = new RightBar(this);
    this.create();
    this.connectButton = document.querySelector(
      "button#connect.sidebar-button"
    );
    this.disconnectButton = document.querySelector(
      "button#disconnect.sidebar-button"
    );
  }
  create() {
    this.bottomBar.create();
    this.rightBar.create();
    this.logger.init();
  }
  getAboutContent() {
    const container = document.createElement("div");
    container.id = "about-container";
    container.innerHTML = `
      <h1>About</h1>
      <p>This is a Smart-Scale application</p>
      <p>Version: ${env.version}</p> 
      <p>GitHub Repository: <a href="https://github.com/your-username/your-repo">https://github.com/your-username/your-repo</a></p>
    `;
    return container;
  }
  connectionCheck() {
    if (this.stillConnected && Date.now() - this.lastStillConnected > 30000) {
      this.stillConnected = false;
      logger.logMessage("Port closed");
    }
  }
  startConnectionCheckLoop() {
    if (this.connectionCheckLoop) clearInterval(this.connectionCheckLoop);
    console.log("starting connection check loop");
    this.connectionCheckLoop = setInterval(() => {
      console.log("checking connection");
      bt.stillConnected();
      this.connectionCheck.bind(this);
    }, 5000);
  }
  stopConnectionCheckLoop() {
    console.log("stopping connection check loop");
    if (this.connectionCheckLoop) clearInterval(this.connectionCheckLoop);
  }
}
class BottomBar {
  constructor(parent) {
    this.parent = parent;
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
  constructor(parent) {
    this.parent = parent;
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
  constructor(item, parent) {
    this.item = item;
    this.parent = parent;
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
  constructor(popupJson, parent) {
    this.parent = parent;
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
  constructor(parent) {
    this.parent = parent;
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
class CreepTestPanel {
  constructor(parent) {
    this.parent = parent;
    this.popupId = "creepTest";
    this.duration = 100;
    this.load = 0;
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
    const creepTestPanel = document.createElement("div");
    creepTestPanel.id = "creepTest-panel";

    // Create save path input
    const loadLabel = document.createElement("label");
    loadLabel.innerHTML = "Load in gms :";
    const loadInput = document.createElement("input");
    loadInput.type = "text";
    loadInput.id = "save-path-input";

    loadLabel.appendChild(loadInput);
    // Create save path input
    const durationLabel = document.createElement("label");
    durationLabel.innerHTML = "Duration (min) :";
    const durationInput = document.createElement("input");
    durationInput.type = "text";
    durationInput.id = "save-path-input";

    durationLabel.appendChild(durationInput);
    // Create save settings button
    const startTestButton = document.createElement("button");
    startTestButton.innerHTML = "Start creep test";
    startTestButton.id = "start-creep-test-button";

    // Append all elements to the settings panel
    creepTestPanel.appendChild(loadLabel);
    creepTestPanel.appendChild(durationLabel);
    creepTestPanel.appendChild(startTestButton);
    document
      .querySelector("#creepTestPopup .popup-content")
      .appendChild(creepTestPanel);
    this.afterCreate();
  }
  afterCreate() {}
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
}
class ChartClass {
  constructor(parent) {
    this.parent = parent;
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
  constructor(parent) {
    this.logs = ["logger initialized"];
    this.parent = parent;
    this.init();
  }
  init() {
    this.popupContent = document.querySelector("#logsPopup .popup-content");
    this.logsContainer = document.getElementById("logsContainer");
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
      this.parent.lastStillConnected = Date.now();
      this.parent.stillConnected = true;
      this.parent.startConnectionCheckLoop();
      this.parent.connectButton.style.backgroundColor = "green";
      this.parent.disconnectButton.style.backgroundColor = "red";
    }
    if (message.includes("ACK: still connected")) {
      // do something
      console.log("still connected");
      this.parent.stillConnected = true;
      this.parent.lastStillConnected = Date.now();
    }
    if (message.includes("Port closed")) {
      // do something
      console.log("dis-connected");
      this.parent.stillConnected = false;
      this.parent.stopConnectionCheckLoop();
      this.parent.connectButton.style.backgroundColor = "red";
      this.parent.disconnectButton.style.backgroundColor = "green";
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
  constructor(parent) {
    this.parent = parent;
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

export { App };
