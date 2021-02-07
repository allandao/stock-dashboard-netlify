const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/*let htmlPageNames = ['stocks'];
let multipleHtmlPlugins = htmlPageNames.map(name => {
  return new HtmlWebpackPlugin({
    template: `./src/${name}.html`, // relative path to the HTML files
    filename: `${name}.html`, // output HTML files
    chunks: [`index`] // respective JS files
  })
});*/

module.exports = {
  entry: {
    main: "./src/index.js"
  },
  output: {
    filename: "main.js",
    path: path.resolve("dist/client")
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ],
  devServer: {
    proxy: {
      "/.netlify": {
        target: "http://localhost:9000",
        pathRewrite: { "^/.netlify/functions": "" }
      }
    }
  }
};
