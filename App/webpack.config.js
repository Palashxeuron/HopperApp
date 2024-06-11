const path = require('path');

module.exports = {
  target: "electron-renderer",
	devtool: "source-map",
  entry: '',
  output: {
    
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    alias: {
			"node:fs": "fs",
			"node:path": "path",
			"node:events": "events",
      "node:buffer": "buffer",
		},
		fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
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
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
};
