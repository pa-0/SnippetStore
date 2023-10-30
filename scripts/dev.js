// process.env.NODE_ENV = 'dev'
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const config = require('./webpack.config')
const signal = require('signale')
const { spawn } = require('child_process')
const electron = require('electron')
const port = 8000
let server = null

const options = {
  allowedHosts: 'all',
  devMiddleware: {
    publicPath: config.output.publicPath
  },
  static: {
    directory: config.output.path,
    publicPath: '/assets'
  },
  hot: true,
  host: 'localhost',
  port
}

async function startServer () {
  const compiler = webpack(config)

  server = new WebpackDevServer(options, compiler)

  const buildDonePromise = new Promise((resolve, reject) => {
    compiler.hooks.done.tap('done', stats => {
      if (!stats.hasErrors()) {
        signal.success(`Bundle success !`)
        resolve(stats)
      } else {
        reject(stats.compilation.errors[0])
      }
    })
  })
  // return new Promise((resolve, reject) => {
  //   compiler.run((err, stats) => {
  //     console.log('BUILD BUILD BUILD')
  //     console.log(err)
  //     if (err) {
  //       console.log('we got an error !!!')
  //       console.log(err)
  //       return reject(err)
  //     }
  //     console.log('done done done ')
  //     console.log(stats.toString())
  //     resolve(stats)
  //   })
  // })

  await server.start()

  signal.success(`Webpack Dev Server listening at localhost:${port}`)
  signal.watch(`Waiting for webpack to bundle...`)
  return buildDonePromise
}

function startElectron () {
  spawn(electron, ['--hot', '--remote-debugging-port=9223', './index.js'], {
    stdio: 'inherit',
    windowsHide: false
  })
    .on('close', () => {
      server.close()
    })
    .on('error', err => {
      signal.error(err)
      server.close()
    })
    .on('disconnect', () => {
      server.close()
    })
    .on('exit', () => {
      server.close()
    })
}

startServer()
  .then(() => {
    startElectron()
    signal.success('Electron started')
  })
  .catch(err => {
    signal.error(err)
    process.exit(1)
  })
