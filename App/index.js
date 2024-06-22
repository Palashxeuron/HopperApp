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
} from "./rendererModules.js";

const loggerClass = new LoggerClass();
//create a global settings instance
const settings = new SettingsPanel();
const bottomBarItems = [
  {
    id: "paired",
    placeholder: "Paired",
    onHover: "Paired to Smart-Scale",
    type: "button",
    onCreate: async () => {
      bt.isPaired().then((isPaired, port) => {
        if (isPaired) {
          console.log("paired to Smart-Scale at port:", port);
          // make connect button green
          document.getElementById("paired").style.backgroundColor = "green";
        }
      });
    },
    onClick: async () => {
      bt.isPaired().then((isPaired, port) => {
        if (isPaired) {
          console.log("paired to Smart-Scale at port:", port);
          // make connect button green
          document.getElementById("paired").style.backgroundColor = "green";
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
      } else {
        console.log("This device does not support Bluetooth");
      }
      bt.connectSmartScale().then((response) => {
        console.log("response", response);
        if (response === "connected") {
          console.log("connected to Smart-Scale");
          // make connect button green
          document.getElementById("Connect").style.backgroundColor = "green";
        }
      });
    },
    onCreate: async () => {},
    position: 1,
  },
  {
    id: "start",
    placeholder: "start",
    onHover: "Start test",
    type: "button",
    onClick: async () => {
      bt.startTest().then((response) => {
        console.log("response", response);
      });
    },
    onCreate: async () => {},
    position: 2,
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
      id: "settings",
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
      id: "coms",
      title: "COM ports",
      onOpen: () => {},
      onClose: () => {},
      onCreate: async () => {
        const comPortTable = new ComPortTable();
        const container = await comPortTable.create();
        document.querySelector("#coms .popup-content").appendChild(container);
        // return container.outerHTML;
      },
    },
    position: 3,
  },
  {
    id: "about",
    placeholder: "About",
    onHover: "Open About",
    type: "popup",
    popup: {
      id: "about",
      title: "About",
      onClose: () => {},
      onOpen: async () => {},
      onCreate: async () => {
        const container = getAboutContent();
        document.querySelector("#about .popup-content").appendChild(container);
      },
    },
    position: 10,
  },
];

const chart = new ChartClass();
const homePage = new HomePage(rightBarItems, bottomBarItems);

function getAboutContent() {
  const container = document.createElement("div");
  container.id = "about-container";
  container.innerHTML = `
    <h1>About</h1>
    <p>This is a Smart-Scale application</p>
    <p>Version: ${env.version}</p> 
    <p>GitHub Repository: <a href="https://github.com/your-username/your-repo">https://github.com/your-username/your-repo</a></p>
  `;
  console.log(env);
  return container;
}
