const { ipcRenderer } = require('electron');

document.getElementById('connect-button').addEventListener('click', () => {
  ipcRenderer.send('connect-arduino', '/dev/tty-usbserial1');
});

ipcRenderer.on('arduino-data', (event, data) => {
  document.getElementById('output').innerText = data;
});
