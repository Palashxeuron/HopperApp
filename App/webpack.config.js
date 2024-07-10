const path = require("node:path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const mainSide_config = {
  target: "node",
  devtool: "source-map",
  devServer: {
    hot: "only",
  },
  entry: {
    assetsHandler: {
      import: "./src/CommonFiles/assetsHandler.js",
      filename: "assetsHandler.js",
      library: {
        name: "assetsHandler",
        type: "commonjs2",
      },
    },
    cloudBackupSync: {
      import: "./src/CommonFiles/cloudBackupSync.js",
      filename: "cloudBackupSync.js",
      library: {
        name: "cloudBackupSync",
        type: "commonjs2",
      },
    },
    autoUpdater: {
      import: "./src/CommonFiles/autoUpdater.js",
      filename: "autoUpdater.js",
      library: {
        name: "autoUpdater",
        type: "commonjs2",
      },
    },
    sensorManager: {
      import: "./src/CommonFiles/sensorManager.js",
      filename: "sensorManager.js",
      library: {
        name: "sensorManager",
        type: "commonjs2",
      },
    },
    saveBlobData: {
      import: "./src/CommonFiles/saveBlobData.js",
      filename: "saveBlobData.js",
      library: {
        name: "saveBlobData",
        type: "commonjs2",
      },
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(puppeteer)\/).*/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  optimization: {
    minimize: false,
    mangleExports: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^node:(.+)$/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
  ],
  resolve: {
    alias: {
      "node:fs": "fs",
      "node:path": "path",
      "node:events": "events"
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url"),
      buffer: require.resolve("buffer"),
      util: require.resolve("util"),
      assert: require.resolve("assert"),
      constants: require.resolve("constants-browserify"),
      vm: require.resolve("vm-browserify"),
      os: require.resolve("os-browserify/browser"),
      events: require.resolve("events"),
    },
    extensions: [".js", ".jsx"],
  },
  externals: {
    fs: "require('fs')",
    path: "require('path')",
    electron: "require('electron')",
    stream: "require('stream')",
    fsextra: "require('fs-extra')",
    http2: "require('http2')",
    "stream/promises": "require('stream/promises')",
    "./safeStore": "commonjs ./safeStore",
  },
};

module.exports = [mainSide_config];
