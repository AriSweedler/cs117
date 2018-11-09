const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

const config = {
  target: 'web',
  entry: './client/index.js',
  watch: true,
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    filename: 'index.js'
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['env']
        }
      }
    ]
  },
}

module.exports = config
