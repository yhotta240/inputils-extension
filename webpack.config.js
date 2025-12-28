const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtensionReloader = require("./scripts/ext-reloader");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

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
    clean: !isDev // 開発環境ではdistフォルダをクリーンしない
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
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  plugins: (() => {
    const plugins = [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "./public",
            to: "./",
            transform(content, absoluteFrom) {
              if (isDev) return content;
              // manifest.jsonの場合、tabs権限を削
              if (absoluteFrom.endsWith('manifest.json')) {
                const manifest = JSON.parse(content.toString());
                if (manifest.permissions) {
                  manifest.permissions = manifest.permissions.filter(p => p !== 'tabs');
                }
                return JSON.stringify(manifest, null, 2);
              }
              return content;
            }
          }
        ]
      })
    ];
    plugins.push(new ExtensionReloader());
    plugins.push(new MiniCssExtractPlugin({
      filename: '[name].css',
    }));
    if (isDev) plugins.push(new Dotenv());
    return plugins;
  })(),
  performance: {
    hints: isDev ? false : "warning"
  }
};
