const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtensionReloader = require("./scripts/ext-reloader");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  mode: isDev ? "development" : "production",
  devtool: isDev ? "inline-source-map" : false,
  entry: {
    background: "./src/background.ts",
    content: "./src/content.ts",
    popup: "./src/popup.ts",
    bootstrap: [
      "bootstrap/dist/css/bootstrap.min.css",
      "bootstrap/dist/js/bootstrap.bundle.min.js",
    ],
    "bootstrap-icons": "bootstrap-icons/font/bootstrap-icons.min.css",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: (() => {
    const plugins = [
      new CopyWebpackPlugin({ patterns: [{ from: "./public", to: "./" }] })
    ];
    if (isDev) {
      plugins.unshift(new ExtensionReloader());
    }
    plugins.push(new MiniCssExtractPlugin());
    return plugins;
  })(),
  performance: {
    hints: isDev ? false : "warning"
  }
};
