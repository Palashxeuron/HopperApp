async function update() {
  const response = await bt.listPorts();
  // console.log("response", response);
  if (response.ports.length === 0) {
    document.getElementById("error").textContent = "No ports discovered";
  }

  document.getElementById("ports").innerHTML = response.html;
}

function refresh() {
  update();
  // setTimeout(refresh, 2000);
}
// refresh();
// connect();

async function connect() {
  const smartScalePort = await bt.getSmartScalePort();
  console.log("smartScalePort", smartScalePort);
}
