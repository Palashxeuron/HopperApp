import React, { useState } from 'react';
const { ipcRenderer } = window.require('electron');

const App = () => {
  const [message, setMessage] = useState('');

  const connectToArduino = () => {
    ipcRenderer.send('connect-arduino', '/dev/tty-usbserial1'); // Change to your Arduino port
  };

  ipcRenderer.on('arduino-data', (event, data) => {
    setMessage(data);
  });

  return (
    <div>
      <h1>Arduino GUI</h1>
      <button id="connect-button" onClick={connectToArduino}>Connect to Arduino</button>
      <p id="output">{message}</p>
    </div>
  );
};

export default App;
