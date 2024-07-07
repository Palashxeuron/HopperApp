class Utils {
  getDateTimeString(date = new Date()) {
    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
const utils = new Utils();
class App {
  constructor() {
    this.logger = new LoggerClass(this);
    this.settings = new SettingsPanel(this);
    this.creepTestPanel = new CreepTestPanel(this);
    this.hysteresisTestPanel = new HysteresisTestPanel(this);
    this.trialPanel = new TrialPanel(this);
    this.calibrationPopup = new CalibrationPopup(this);
    this.chart = new ChartClass(this);
    this.stillConnected = false;
    this.onGoingTest = false; // flag to check if a test is ongoing
    this.isPlotting = false;
    this.connectionCheckLoop = null;
    this.latestMessageTimeStamp = null;
    this.currentCreepTestId = null;
    this.currentHysteresisTestId = null;
    this.testStartTime = null;
    this.testStopTime = null;
    this.maxDataSize = 100 * 1024 * 1024; // 100 MB in bytes
    this.data = [];
    this.testData = [];
    this.dataSize = 0;
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
        id: "hopperTrial",
        placeholder: "HopperFlow Trial",
        onHover: "HopperFlow Trial",
        type: "popup",
        popup: {
          id: "hopperTrialPopup",
          title: "Hopper Flow Trial specifications",
          onClose: () => {},
          onOpen: async () => {},
          onCreate: async () => {
            await this.trialPanel.create();
          },
        },
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
        type: "popup",
        popup: {
          id: "hysteresisTestPopup",
          title: "Hysteresis Test",
          onClose: () => {},
          onOpen: async () => {},
          onCreate: async () => {
            await this.hysteresisTestPanel.create();
          },
        },
        position: 2,
      },
      {
        id: "openResults",
        placeholder: "Open Results",
        onHover: "Open Results",
        type: "button",
        onClick: async () => {
          fileStorage.openResultDir();
        },
        onCreate: async () => {},
        position: 10,
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
  saveData(weight, time) {
    const newData = { weight, time };
    const newDataSize = JSON.stringify(newData).length;
    this.onGoingTest ? this.testData.push(newData) : null;
    if (this.dataSize + newDataSize <= this.maxDataSize) {
      this.data.push(newData);
      this.dataSize += newDataSize;
    } else {
      // Remove oldest data until there is enough space for the new data
      while (this.dataSize + newDataSize > this.maxDataSize) {
        const oldestData = this.data.shift();
        this.dataSize -= JSON.stringify(oldestData).length;
      }
      this.data.push(newData);
      this.dataSize += newDataSize;
    }
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
    if (
      this.stillConnected &&
      Date.now() - this.latestMessageTimeStamp > 20000
    ) {
      this.stillConnected = false;
      logger.logMessage("Port closed");
    }
  }
  startConnectionCheckLoop() {
    if (this.connectionCheckLoop) clearInterval(this.connectionCheckLoop);
    console.log("starting connection check loop");
    this.connectionCheckLoop = setInterval(() => {
      if (Date.now() - this.latestMessageTimeStamp > 5000) {
        console.log("checking connection");
        // only send the still Connected message to scale if
        // we have not received any message for 15 seconds
        bt.stillConnected();
      }
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
class TrialPanel {
  constructor(parent) {
    this.parent = parent;
    this.popupId = "hopperTrial";
    this.chainLengthInput = 1;
    this.angleInput = 60;
    this.widthInput = 1;
    this.init();
    this.initDone = this.init();
    this.startButton = document.getElementById("start-hopperTrial-button");
    this.stopButton = document.getElementById("stop-hopperTrial-button");
    this.startButtonEnabled = true;
  }
  isReady() {
    return this.initDone;
  }
  async init() {}
  // create settings panel that let user select port from a dropdown and select save path opening a file dialog
  async create() {
    // make sure init is done with isReady
    await this.isReady();
    const hopperTrialPanel = document.createElement("div");
    hopperTrialPanel.id = "hopperTrial-panel";

    // Create chainLength input
    const chainLengthLabel = document.createElement("label");
    chainLengthLabel.innerHTML = "chainLength, N :";
    const chainLengthInput = document.createElement("input");
    chainLengthInput.type = "text";
    chainLengthInput.id = "hopperTrial-chainLength-input";
    chainLengthInput.value = "1";
    chainLengthLabel.appendChild(chainLengthInput);

    // Create save path input
    const angleLabel = document.createElement("label");
    angleLabel.innerHTML = "angle (deg) :";
    const angleInput = document.createElement("input");
    angleInput.type = "text";
    angleInput.id = "hopperTrial-angle-input";
    angleInput.value = "60";
    angleLabel.appendChild(angleInput);

    // Create save path input
    const widthLabel = document.createElement("label");
    widthLabel.innerHTML = "width (cm) :";
    const widthInput = document.createElement("input");
    widthInput.type = "text";
    widthInput.id = "hopperTrial-width-input";
    widthInput.value = "1";
    widthLabel.appendChild(widthInput);

    // Create save settings button
    const startTestButton = document.createElement("button");
    startTestButton.innerHTML = "Start hopper trial";
    startTestButton.id = "start-hopperTrial-button";
    const stopTestButton = document.createElement("button");
    stopTestButton.innerHTML = "Stop hopper trial";
    stopTestButton.id = "stop-hopperTrial-button";
    stopTestButton.style.display = "none";

    // Append all elements to the settings panel
    hopperTrialPanel.appendChild(chainLengthLabel);
    hopperTrialPanel.appendChild(angleLabel);
    hopperTrialPanel.appendChild(widthLabel);
    hopperTrialPanel.appendChild(startTestButton);
    hopperTrialPanel.appendChild(stopTestButton);
    document
      .querySelector("#hopperTrialPopup .popup-content")
      .appendChild(hopperTrialPanel);
    this.afterCreate();
  }
  afterCreate() {
    this.startButton = document.getElementById("start-hopperTrial-button");
    this.stopButton = document.getElementById("stop-hopperTrial-button");
    this.chainLengthInput = document.getElementById(
      "hopperTrial-chainLength-input"
    );
    this.angleInput = document.getElementById("hopperTrial-angle-input");
    this.widthInput = document.getElementById("hopperTrial-width-input");
    this.startButton.onclick = async () => {
      this.testChainLength = this.readInput("hopperTrial-chainLength-input");
      this.testAngle = this.readInput("hopperTrial-angle-input");
      this.testWidth = this.readInput("hopperTrial-width-input");
      this.startTest();
    };
    this.stopButton.onclick = async () => {
      this.stopTest();
    };
  }
  readInput(inputElementId) {
    const input = document.getElementById(inputElementId);
    return input.value;
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
  startTest() {
    // generate a test id using dateTime and save it to this.parent.currentCreepTestId
    this.parent.chart.resetChart();
    this.parent.testStartTime = new Date();
    this.parent.testStopTime = null;
    this.parent.currentHopperTrialId = utils.getDateTimeString(
      this.parent.testStartTime
    );
    this.parent.isPlotting = true;
    console.log(this.parent.currentHopperTrialId);
    this.parent.onGoingTest = true;
    this.toggleStartStopButton();
    // disable load and duration input
    this.disableInputs();
  }
  disableInputs(disable = true) {
    this.chainLengthInput.disabled = disable;
    this.angleInput.disabled = disable;
    this.widthInput.disabled = disable;
  }
  writeData() {
    // save data to file using this.parent.currentCreepTestId as filename
    const data = this.parent.testData;
    fileStorage.writeData({
      id: this.parent.currentHopperTrialId,
      test: "hopperTrial",
      filename: `HopperTrial_${this.parent.currentHopperTrialId}_data`,
      data: data,
      type: "json",
      chainLength: this.testChainLength,
      angle: this.testAngle,
      width: this.testWidth,
      startTime: this.parent.testStartTime,
      stopTime: this.parent.testStopTime,
    });
  }
  generateReport() {
    // generate report using data and save it to file using this.parent.currentCreepTestId as filename
    fileStorage.generateReport({
      id: this.parent.currentCreepTestId,
      filename: `HopperTrial${this.parent.currentCreepTestId}_report`,
      // data: this.parent.data, // better to pull the data from the file using the id
      type: "pdf",
      reportTemplate: "hopperTrial",
      chainLength: this.testChainLength,
      angle: this.testAngle,
      width: this.testWidth,
    });
  }
  stopTest() {
    this.parent.onGoingTest = false;
    this.parent.isPlotting = false;
    this.parent.testStopTime = new Date();
    this.writeData();
    // this.generateReport();
    this.toggleStartStopButton();
    this.parent.testData = [];
    this.parent.currentHopperTrialId = null;
    // enable load and duration input
    this.disableInputs(false);
  }
  toggleStartStopButton() {
    // enable the stop button
    if (this.startButtonEnabled) {
      this.startButtonEnabled = false;
      this.startButton.style.display = "none";
      this.stopButton.style.display = "block";
    } else {
      this.startButtonEnabled = true;
      this.startButton.style.display = "block";
      this.stopButton.style.display = "none";
    }
  }
}
class HysteresisTestPanel {
  constructor(parent) {
    this.parent = parent;
    this.popupId = "hysteresisTest";
    this.duration = 100;
    this.load = 100;
    this.init();
    this.initDone = this.init();
    this.startButton = document.getElementById("start-hysteresisTest-button");
    this.stopButton = document.getElementById("stop-hysteresisTest-button");
    this.startButtonEnabled = true;
  }
  isReady() {
    return this.initDone;
  }
  async init() {}
  // create settings panel that let user select port from a dropdown and select save path opening a file dialog
  async create() {
    // make sure init is done with isReady
    await this.isReady();
    const hysteresisTestPanel = document.createElement("div");
    hysteresisTestPanel.id = "hysteresisTest-panel";

    // Create save path input
    const loadLabel = document.createElement("label");
    loadLabel.innerHTML = "Load in gms :";
    const loadInput = document.createElement("input");
    loadInput.type = "text";
    loadInput.id = "hysteresisTest-load-input";
    loadInput.value = "100";

    loadLabel.appendChild(loadInput);
    // Create save path input
    const durationLabel = document.createElement("label");
    durationLabel.innerHTML = "Duration (min) :";
    const durationInput = document.createElement("input");
    durationInput.type = "text";
    durationInput.id = "hysteresisTest-duration-input";
    durationInput.value = "100";

    durationLabel.appendChild(durationInput);
    // Create save settings button
    const startTestButton = document.createElement("button");
    startTestButton.innerHTML = "Start hysteresis test";
    startTestButton.id = "start-hysteresisTest-button";
    const stopTestButton = document.createElement("button");
    stopTestButton.innerHTML = "Stop hysteresis test";
    stopTestButton.id = "stop-hysteresisTest-button";
    stopTestButton.style.display = "none";

    // Append all elements to the settings panel
    hysteresisTestPanel.appendChild(loadLabel);
    hysteresisTestPanel.appendChild(durationLabel);
    hysteresisTestPanel.appendChild(startTestButton);
    hysteresisTestPanel.appendChild(stopTestButton);
    document
      .querySelector("#hysteresisTestPopup .popup-content")
      .appendChild(hysteresisTestPanel);
    this.afterCreate();
  }
  afterCreate() {
    this.startButton = document.getElementById("start-hysteresisTest-button");
    this.stopButton = document.getElementById("stop-hysteresisTest-button");
    this.loadInput = document.getElementById("hysteresisTest-load-input");
    this.durationInput = document.getElementById("hysteresisTest-duration-input");
    this.startButton.onclick = async () => {
      this.testLoad = this.readLoad();
      this.testDuration = this.readDuration();
      this.startTest();
    };
    this.stopButton.onclick = async () => {
      this.stopTest();
    };
  }
  readLoad() {
    const loadInput = document.getElementById("hysteresisTest-load-input");
    return loadInput.value;
  }
  readDuration() {
    const durationInput = document.getElementById("hysteresisTest-duration-input");
    return durationInput.value;
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
  startTest() {
    // generate a test id using dateTime and save it to this.parent.currentHysteresisTestId
    this.parent.chart.resetChart();
    this.parent.testStartTime = new Date();
    this.parent.testStopTime = null;
    this.parent.currentHysteresisTestId = utils.getDateTimeString(
      this.parent.testStartTime
    );
    this.parent.isPlotting = true;
    console.log(this.parent.currentHysteresisTestId);
    this.parent.onGoingTest = true;
    this.toggleStartStopButton();
    // disable load and duration input
    this.loadInput.disabled = true;
    this.durationInput.disabled = true;
  }
  writeData() {
    // save data to file using this.parent.currentHysteresisTestId as filename
    const data = this.parent.testData;
    fileStorage.writeData({
      id: this.parent.currentHysteresisTestId,
      test: "Hysteresis",
      filename: `HysteresisTest_${this.parent.currentHysteresisTestId}_data`,
      data: data,
      type: "json",
      load: this.testLoad,
      duration: this.testDuration,
      startTime: this.parent.testStartTime,
      stopTime: this.parent.testStopTime,
    });
  }
  generateReport() {
    // generate report using data and save it to file using this.parent.currentCreepTestId as filename
    fileStorage.generateReport({
      id: this.parent.currentHysteresisTestId,
      filename: `HysteresisTest_${this.parent.currentHysteresisTestId}_report`,
      // data: this.parent.data, // better to pull the data from the file using the id
      type: "json",
      reportTemplate: "HysteresisTest",
      load: this.testLoad,
      duration: this.testDuration,
    });
  }
  stopTest() {
    this.parent.onGoingTest = false;
    this.parent.isPlotting = false;
    this.parent.testStopTime = new Date();
    this.writeData();
    // this.generateReport();
    this.toggleStartStopButton();
    this.parent.testData = [];
    this.parent.currentHysteresisTestId = null;
    // enable load and duration input
    this.loadInput.disabled = false;
    this.durationInput.disabled = false;
  }
  toggleStartStopButton() {
    // enable the stop button
    if (this.startButtonEnabled) {
      this.startButtonEnabled = false;
      this.startButton.style.display = "none";
      this.stopButton.style.display = "block";
    } else {
      this.startButtonEnabled = true;
      this.startButton.style.display = "block";
      this.stopButton.style.display = "none";
    }
  }
}
class CreepTestPanel {
  constructor(parent) {
    this.parent = parent;
    this.popupId = "creepTest";
    this.duration = 100;
    this.load = 100;
    this.init();
    this.initDone = this.init();
    this.startButton = document.getElementById("start-creep-test-button");
    this.stopButton = document.getElementById("stop-creep-test-button");
    this.startButtonEnabled = true;
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
    loadInput.id = "creep-test-load-input";
    loadInput.value = "100";

    loadLabel.appendChild(loadInput);
    // Create save path input
    const durationLabel = document.createElement("label");
    durationLabel.innerHTML = "Duration (min) :";
    const durationInput = document.createElement("input");
    durationInput.type = "text";
    durationInput.id = "creep-test-duration-input";
    durationInput.value = "100";

    durationLabel.appendChild(durationInput);
    // Create save settings button
    const startTestButton = document.createElement("button");
    startTestButton.innerHTML = "Start creep test";
    startTestButton.id = "start-creep-test-button";
    const stopTestButton = document.createElement("button");
    stopTestButton.innerHTML = "Stop creep test";
    stopTestButton.id = "stop-creep-test-button";
    stopTestButton.style.display = "none";

    // Append all elements to the settings panel
    creepTestPanel.appendChild(loadLabel);
    creepTestPanel.appendChild(durationLabel);
    creepTestPanel.appendChild(startTestButton);
    creepTestPanel.appendChild(stopTestButton);
    document
      .querySelector("#creepTestPopup .popup-content")
      .appendChild(creepTestPanel);
    this.afterCreate();
  }
  afterCreate() {
    this.startButton = document.getElementById("start-creep-test-button");
    this.stopButton = document.getElementById("stop-creep-test-button");
    this.loadInput = document.getElementById("creep-test-load-input");
    this.durationInput = document.getElementById("creep-test-duration-input");
    this.startButton.onclick = async () => {
      this.testLoad = this.readLoad();
      this.testDuration = this.readDuration();
      this.startTest();
    };
    this.stopButton.onclick = async () => {
      this.stopTest();
    };
  }
  readLoad() {
    const loadInput = document.getElementById("creep-test-load-input");
    return loadInput.value;
  }
  readDuration() {
    const durationInput = document.getElementById("creep-test-duration-input");
    return durationInput.value;
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
  startTest() {
    // generate a test id using dateTime and save it to this.parent.currentCreepTestId
    this.parent.chart.resetChart();
    this.parent.testStartTime = new Date();
    this.parent.testStopTime = null;
    this.parent.currentCreepTestId = utils.getDateTimeString(
      this.parent.testStartTime
    );
    this.parent.isPlotting = true;
    console.log(this.parent.currentCreepTestId);
    this.parent.onGoingTest = true;
    this.toggleStartStopButton();
    // disable load and duration input
    this.loadInput.disabled = true;
    this.durationInput.disabled = true;
  }
  writeData() {
    // save data to file using this.parent.currentCreepTestId as filename
    const data = this.parent.testData;
    fileStorage.writeData({
      id: this.parent.currentCreepTestId,
      test: "creep",
      filename: `CreepTest_${this.parent.currentCreepTestId}_data`,
      data: data,
      type: "json",
      load: this.testLoad,
      duration: this.testDuration,
      startTime: this.parent.testStartTime,
      stopTime: this.parent.testStopTime,
    });
  }
  generateReport() {
    // generate report using data and save it to file using this.parent.currentCreepTestId as filename
    fileStorage.generateReport({
      id: this.parent.currentCreepTestId,
      filename: `CreepTest_${this.parent.currentCreepTestId}_report`,
      // data: this.parent.data, // better to pull the data from the file using the id
      type: "json",
      reportTemplate: "creepTest",
      load: this.testLoad,
      duration: this.testDuration,
    });
  }
  stopTest() {
    this.parent.onGoingTest = false;
    this.parent.isPlotting = false;
    this.parent.testStopTime = new Date();
    this.writeData();
    // this.generateReport();
    this.toggleStartStopButton();
    this.parent.testData = [];
    this.parent.currentCreepTestId = null;
    // enable load and duration input
    this.loadInput.disabled = false;
    this.durationInput.disabled = false;
  }
  toggleStartStopButton() {
    // enable the stop button
    if (this.startButtonEnabled) {
      this.startButtonEnabled = false;
      this.startButton.style.display = "none";
      this.stopButton.style.display = "block";
    } else {
      this.startButtonEnabled = true;
      this.startButton.style.display = "block";
      this.stopButton.style.display = "none";
    }
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
    // create chart with chart.js
    const ctx = this.canvas.getContext("2d");
    this.myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.xLabels,
        datasets: [
          {
            label: "Weight vs Time",
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
            ticks: {
              maxTicksLimit: 10, // Adjust this value as needed
            },
          },
          x: {
            ticks: {
              maxTicksLimit: 15, // Adjust this value as needed
            },
          },
        },
      },
    });
    this.update();
  }
  async update() {
    if (this.parent.isPlotting) {
      console.log("updating chart");
      // get x and y data
      await this.refreshChartData();
      // update chart
      this.myChart.data.labels = this.xLabels;
      this.myChart.data.datasets[0].data = this.yData;
      // Redraw the chart
      this.myChart.update();
    }
    setTimeout(this.update.bind(this), this.chartUpdateInterval);
  }
  async refreshChartData() {
    // console.log(this.parent.testData.length);
    if (this.parent.testData.length > 0) {
      this.xData = this.parent.testData.map(
        (data) => new Date(data.time.trim())
      );
      this.xLabels = this.dateStr2xLabels();
      this.yData = this.parent.testData.map((data) => parseFloat(data.weight));
      // console.log("xData", this.xLabels, "yData", this.yData);
    }
  }
  dateStr2xLabels() {
    const formattedLabels = [];

    const duration = this.xData[this.xData.length - 1] - this.xData[0]; // Duration in milliseconds

    // Format as HH:mm
    this.xData.forEach((date) =>
      formattedLabels.push(
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      )
    );

    // console.log("formattedLabels", formattedLabels);
    return formattedLabels;
  }
  resetChart() {
    this.xData = [];
    this.yData = [];
    this.xLabels = [];
    this.myChart.data.labels = this.xLabels;
    this.myChart.data.datasets[0].data = this.yData;
    this.myChart.update();
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
        this.parent.latestMessageTimeStamp = Date.now();
        if (message.includes("WEIGHT:")) {
          this.handleWeightMessage(message);
        } else {
          this.logs.push(message);
          this.handleLogMessage(message);
        }
        this.render();
      }
    });
    this.listenerAdded = true;
  }
  handleWeightMessage(message) {
    // extract weight and time from message sent as
    // String str = "WEIGHT: " + String(sensorRead) + " g" + ";TIME: " + String(millis()) + " ms";
    const weight = message.split("WEIGHT: ")[1].split(" g")[0];
    const time = message.split("TIME: ")[1].split(" ms")[0];
    // console.log("weight", weight, "time", time);

    this.parent.saveData(weight, time);

    this.parent.lastStillConnected = Date.now();
    if (this.parent.stillConnected === false) {
      this.parent.stillConnected = true;
      this.parent.connectButton.style.backgroundColor = "green";
      this.parent.disconnectButton.style.backgroundColor = "red";
    }
  }
  handleLogMessage(message) {
    // console.log("message", message);

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
    if (message.includes("ACK: calibrated using:")) {
      const regex = /calibrated using: (\d+(\.\d+)?);Result: (\d+(\.\d+)?) g/;
      const match = inputString.match(regex);
      if (match) {
        const calibrationFactor = parseFloat(match[1]);
        const reading = parseFloat(match[3]);
        document.getElementById("weight-calibration-reading").textContent =
          reading;
        console.log(
          `Calibration Factor: ${calibrationFactor}, Reading: ${reading}`
        );
      } else {
        console.log("No match found");
      }
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
    instructionLabel1.innerHTML = "Enter the desired calibration factor";

    // Create input wrapper
    const calFactorInputWrapper = document.createElement("div");
    calFactorInputWrapper.style.display = "flex";
    calFactorInputWrapper.style.alignItems = "center";

    // Create input for weight
    const calFactorInput = document.createElement("input");
    calFactorInput.type = "number";
    calFactorInput.id = "calFactor-input";
    calFactorInput.style.marginRight = "5px"; // Space between input and text

    // Append input and unit text to wrapper
    calFactorInputWrapper.appendChild(calFactorInput);

    // Create warning message
    const warningMessage = document.createElement("p");
    warningMessage.id = "warning-message";
    warningMessage.style.color = "red";
    warningMessage.style.display = "none";
    warningMessage.innerHTML = "Please enter a valid number.";

    // Add event listener to weight input to show warning if input is invalid
    calFactorInput.addEventListener("input", () => {
      if (isNaN(calFactorInput.value) || calFactorInput.value.trim() === "") {
        warningMessage.style.display = "block";
      } else {
        warningMessage.style.display = "none";
      }
    });

    // Create second instruction label
    const instructionLabel2 = document.createElement("label");
    instructionLabel2.id = "weight-calibration-reading";
    instructionLabel2.innerHTML = "";

    // Create calibrate button
    const calibrateButton = document.createElement("button");
    calibrateButton.innerHTML = "Calibrate";
    calibrateButton.id = "calibrate-button";

    // Append all elements to the calibration panel
    // calibrationPanel.appendChild(title);
    calibrationPanel.appendChild(instructionLabel1);
    calibrationPanel.appendChild(warningMessage);
    calibrationPanel.appendChild(calFactorInputWrapper);
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
      const factor = this.readFactor();
      // save factor somewhere permanently
      localStorage.setItem("calibrationFactor", factor);
      bt.calibrate(factor);
    };
  }
  readFactor() {
    const calFactorInput = document.getElementById("calFactor-input");
    return calFactorInput.value;
  }
  closePopup(id = this.popupId) {
    document.getElementById(id).style.display = "none";
  }
}

export { App };
