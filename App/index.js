const bottomBarItems = [
  {
    id: "home",
    placeholder: "Home",
    onHover: "Go to Home",
    onClick: { type: "button", id: "home" },
    position: 1,
  },
  {
    id: "settings",
    placeholder: "Settings",
    onHover: "Open Settings",
    onClick: { type: "button", id: "settings" },
    position: 2,
  },
  {
    id: "about",
    placeholder: "About",
    onHover: "Open About",
    onClick: { type: "button", id: "about" },
    position: 10,
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
      content: "This is the content of settings.",
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

class homePageState {}

class BottomBar {
  constructor(homePage) {
    this.parent = homePage;
    this.items = bottomBarItems;
  }
  create() {
    this.items.forEach((item) => {
      let button = document.createElement("button");
      button.className = "sidebar-button";
      button.onclick = () => this.parent.openPopup(item.onClick);
      button.innerHTML = item.placeholder;
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
    let popupContent = document.createElement("div");
    popupContent.className = "popup-content";
    let close = document.createElement("span");
    close.className = "close";
    close.innerHTML = "&times;";
    close.onclick = () => this.closePopup();
    let title = document.createElement("h2");
    title.innerHTML = this.popupItem.title;
    let content = document.createElement("p");
    if (typeof this.popupItem.content === 'function') {
      content.innerHTML = await this.popupItem.content();
    } else {
      content.innerHTML = this.popupItem.content;
    }
    popupContent.appendChild(close);
    popupContent.appendChild(title);
    popupContent.appendChild(content);
    this.popup.appendChild(popupContent);
    document.getElementById("popups").appendChild(this.popup); // append to popups
  }
  openPopup() {
    document.getElementById(this.popupItem.id).style.display = "block";
  }

  closePopup() {
    document.getElementById(this.popupItem.id).style.display = "none";
  }
}

class ComPortTable {
  constructor() {
  }

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
const homePage = new HomePage();
