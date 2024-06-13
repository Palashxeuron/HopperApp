class HomePage {
  constructor() {
    this.bottomBar = new BottomBar(this);
    this.rightBar = new RightBar(this);
    this.create();
  }
  create() {
    this.bottomBar.create();
    this.rightBar.create();
  }
}
class BottomBar {
  constructor(homePage) {
    this.parent = homePage;
    this.items = bottomBarItems;
  }
  create() {
    this.items.forEach((item) => {
      const button = new BarItem(item, this.parent).create();
      document.getElementById("bottom-bar").appendChild(button);
    });
  }
}
class RightBar {
  constructor(homePage) {
    this.parent = homePage;
    this.items = rightBarItems;
  }
  create() {
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
    let button = document.createElement("button");
    button.className = "sidebar-button";
    if (this.item.onClick === "popup") {
      this.popup = new Popup(this.item.popup, this.parent);
      this.popup.create();
      button.onclick = () => this.popup.openPopup();
    }
    if (this.item.onClick === "button") {
      button.onclick = this.item.button;
    }
    button.innerHTML = this.item.placeholder;
    return button;
  }
}
class Popup {
  constructor(popupJson, homePage) {
    this.parent = homePage;
    this.popupItem = popupJson;
    this.popup = null;
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
    if (typeof this.popupItem.content === "function") {
      content.innerHTML = await this.popupItem.content();
    } else {
      content.innerHTML = this.popupItem.content;
    }
    popupContent.appendChild(close);
    popupContent.appendChild(title);
    popupContent.appendChild(content);
    this.popup.appendChild(popupContent);
    document.getElementById("popups").appendChild(this.popup); // append to popups

    if (this.popupItem.todo) {
      await this.popupItem.todo();
    }
  }
  openPopup(id = this.popupItem.id) {
    document.getElementById(id).style.display = "block";
  }

  closePopup(id = this.popupItem.id) {
    document.getElementById(id).style.display = "none";
  }
}
class ComPortTable {
  constructor() {}

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

    return settingsPanel;
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
//create a global settings instance
const settings = new SettingsPanel();
const bottomBarItems = [
  {
    id: "Connect",
    placeholder: "connect",
    onHover: "Connect to Smart-Scale",
    onClick: "button",
    button: async () => {
      if ("bluetooth" in navigator) {
        console.log("This device supports Bluetooth");
      } else {
        console.log("This device does not support Bluetooth");
      }
    },
    position: 1,
  },
  {
    id: "start",
    placeholder: "start",
    onHover: "Start test",
    onClick: "button",
    button: async () => {},
    position: 2,
  },
];
const rightBarItems = [
  {
    id: "logs",
    placeholder: "Logs",
    onHover: "Open Logs",
    onClick: "popup",
    popup: {
      id: "logs",
      onClose: "logs",
      title: "Logs",
      content: "This is the content of Logs.",
    },
    position: 1,
  },
  {
    id: "settings",
    placeholder: "Settings",
    onHover: "Open Settings",
    onClick: "popup",
    popup: {
      id: "settings",
      onClose: "settings",
      title: "Settings",
      content: async () => {
        const container = await settings.create();
        return container.outerHTML;
      },
      todo: async () => {
        settings.afterCreate();
      },
    },
    position: 2,
  },
  {
    id: "coms",
    placeholder: "COM ports",
    onHover: "Show COM ports",
    onClick: "popup",
    popup: {
      id: "coms",
      onClose: "coms",
      title: "COM ports",
      content: async () => {
        const comPortTable = new ComPortTable();
        const container = await comPortTable.create();
        return container.outerHTML;
      },
    },
    position: 3,
  },
  {
    id: "about",
    placeholder: "About",
    onHover: "Open About",
    onClick: "popup",
    popup: {
      id: "about",
      onClose: "about",
      title: "About",
      content: "This is the content of about.",
    },
    position: 10,
  },
];
const chart = new ChartClass();
const homePage = new HomePage();
