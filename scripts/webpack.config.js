const skeleton = require('./webpack-skeleton')
const path = require('path')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const webpack = require('webpack')

/** @type{import('webpack').Configuration} */
var config = Object.assign({}, skeleton, {
  mode: 'development',
  output: {
    path: path.join(__dirname, '..', 'compiled'),
    filename: '[name].js',
    publicPath: 'http://localhost:8000/assets/',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new NodeTargetPlugin()
  ],
  devtool: 'eval-source-map',
  target: 'electron-renderer'
})

module.exports = config
