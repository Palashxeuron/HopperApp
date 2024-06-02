const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

let win;
let port;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('dist/index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('connect-arduino', (event, arg) => {
  port = new SerialPort(arg, { baudRate: 9600 });
  const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

  parser.on('data', (data) => {
    win.webContents.send('arduino-data', data);
  });

  port.on('open', () => {
    console.log('Serial Port Opened');
  });

  port.on('error', (err) => {
    console.error('Error: ', err.message);
  });
});
