import {
  HomePage,
  // BottomBar,
  // RightBar,
  // BarItem,
  // Popup,
  ComPortTable,
  SettingsPanel,
  ChartClass,
  LoggerClass,
  CalibrationPopup,
} from "./rendererModules.js";

const loggerClass = new LoggerClass();
//create a global settings instance
const settings = new SettingsPanel();
const calibrationPopup = new CalibrationPopup();
const bottomBarItems = [
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
const rightBarItems = [
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
        await loggerClass.render();
      },
      onCreate: async () => {
        loggerClass.onCreate();
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
        await settings.create();
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
        calibrationPopup.create();
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
        const container = getAboutContent();
        document
          .querySelector("#aboutPopup .popup-content")
          .appendChild(container);
      },
    },
    position: 10,
  },
];

const chart = new ChartClass();
const homePage = new HomePage(
  rightBarItems,
  bottomBarItems,
  loggerClass,
  calibrationPopup
);

function getAboutContent() {
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

// window.onload = async () => {
//   bt.connectSmartScale();
// };
