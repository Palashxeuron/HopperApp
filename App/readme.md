# Smart Scale Application

This project is a GUI application for SmartScale, designed to be used with the Hopper experiment. It leverages Electron to provide a cross-platform experience for interacting with smart scales, managing serial port connections, and visualizing data.

## Features

- **Serial Port Management**: List and refresh available serial ports to connect with the SmartScale.
- **Data Visualization**: Retrieve and display chart data from the SmartScale.
- **Smart Scale Connection**: Connect to a SmartScale device to start receiving data.
- **File Management**: Select local directories for saving experiment data.
- **Logging**: Integrated logging functionality for debugging and monitoring application behavior.

## Getting Started

### Prerequisites

- Node.js (v14 or newer recommended)
- npm (v6 or newer)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/smart-scale.git
   ```
2. Navigate to the project directory:
   ```sh
   cd smart-scale
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Running the Application
   - To start the application in development mode:
     ```sh
     npm start
     ```
   - To build the application for production:
     ```sh
     npm run build
     ```

### Development

This project uses Electron for the desktop application framework, Webpack for bundling, and several other dependencies for various functionalities.

#### Key Files and Directories

- `main.js`: The Electron main process script.
- `renderer.js`: The renderer process script.
- `ipcHandler.js`: Handles IPC communication between the main and renderer processes.
- `connectionHandler.js`: Manages serial port connections.
- `preload.js`: Preloads scripts before the renderer process starts.
- `index.html/css/js`: The web application's entry point and styles/scripts.
- `webpack.config.js`: Configuration for Webpack.

#### Scripts

- `wp-build`: Builds the application using Webpack in production mode.
- `start`: Runs the application in development mode with hot reloading.

### Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

### License

This project is licensed under the ISC License. See the LICENSE file for details.

This README provides a basic overview of the Smart Scale application, including its features, how to get started with development, and how to contribute to the project. Adjust the repository URL and any other specific details as necessary.
