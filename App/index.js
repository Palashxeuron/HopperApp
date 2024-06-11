class homePage {
  constructor() {
    this.bottomBar = new BottomBar(this);
    this.rightBar = new RightBar(this);
  }
  create() {
    this.bottomBar.create();
    this.rightBar.create();
  }

  openPopup(id) {
    document.getElementById(id).style.display = "block";
  }

  closePopup(id) {
    document.getElementById(id).style.display = "none";
  }
}

class homePageState {}

class BottomBar {
  constructor() {
    this.items = [
      {
        id: "home",
        placeholder: "Home",
        onHover: "Go to Home",
        onClick: openPopup("home"),
        position: 1,
      },
      {
        id: "settings",
        placeholder: "Settings",
        onHover: "Open Settings",
        onClick: openPopup("settings"),
        position: 2,
      },
      {
        id: "about",
        placeholder: "About",
        onHover: "Open About",
        onClick: openPopup("about"),
        position: 10,
      },
    ];
  }
  create() {
    this.items.forEach((item) => {
      // <button class="sidebar-button" onclick="openPopup('popup1')">Popup 1</button>
      //     <button class="sidebar-button" onclick="openPopup('popup2')">Popup 2</button>
      //     <button class="sidebar-button" onclick="openPopup('popup3')">Popup 3</button>
      let button = document.createElement("button");
      button.className = "sidebar-button";
      button.onclick = item.onClick;
      button.innerHTML = item.placeholder;
      document.getElementById("bottom-bar").appendChild(button);
    });
  }
}
class RightBar {
  constructor(parent) {
    this.parent = parent;
    this.items = [
      {
        id: logs,
        placeholder: "Logs",
        onHover: "Open Logs",
        onClick: this.parent.openPopup("logs"),
        position: 1,
      },
      {
        id: settings,
        placeholder: "Settings",
        onHover: "Open Settings",
        onClick: this.parent.openPopup("settings"),
        position: 2,
      },
      {
        id: about,
        placeholder: "About",
        onHover: "Open About",
        onClick: this.parent.openPopup("about"),
        position: 10,
      },
    ];
  }
  create() {
    this.items.forEach((item) => {
      let button = document.createElement("button");
      button.className = "sidebar-button";
      button.onclick = item.onClick;
      button.innerHTML = item.placeholder;
      document.getElementById("right-bar").appendChild(button);
    });
  }
}
