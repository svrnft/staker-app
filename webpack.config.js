const
  path = require("path"), fs = require("fs"),
  {ProvidePlugin, DefinePlugin} = require("webpack"),
  CopyPlugin = require("copy-webpack-plugin"), HtmlPlugin = require("html-webpack-plugin")

module.exports = {
  entry: "./src/app.js",
  // devtool: "inline-source-map",
  output: {
    filename: "app.js",
    publicPath: "/"
  },
  plugins: [
    new HtmlPlugin({
      template: "./src/index.html",
      publicPath: "/"
    }),
    new CopyPlugin({
      patterns: [
        {from: "public"}
      ]
    }),
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    }),
    new DefinePlugin({
      __version__: DefinePlugin.runtimeValue(() => JSON.stringify(JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"))).version), {
        fileDependencies: [path.resolve(__dirname, "./package.json")]
      })
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
    ]
  },
  devServer: {
    port: 2023,
    historyApiFallback: true,
    proxy: {
      "/api": "http://127.0.0.1:2022"
    }
  },
}