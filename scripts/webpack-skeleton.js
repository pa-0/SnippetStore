const path = require('path')

var config = {
  entry: {
    main: [path.join(__dirname, '../browser/index.jsx')]
    // searchWorker: [path.join(__dirname, '../browser/workers/search.js')]
  },
  module: {
    noParse: /codemirror\/.*\.html$/,
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(js|jsx)$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: ['file-loader']
      },
      {
        test: /\.(ttf|woff2|eot|woff)$/,
        use: ['file-loader']
      },
      {
        test: /\.svg$/,
        use: ['svg-inline-loader']
      }
      // {
      //   test: /\.html$/,
      //   use: [{
      //     loader: 'html-loader',
      //     options: {
      //       // Disables attributes processing
      //       sources: false
      //     }
      //   }]
      // }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.scss', '.sass'],
    alias: {
      app: path.join(__dirname, '..', 'app'),
      browser: path.join(__dirname, '..', 'browser'),
      render: path.join(__dirname, '..', 'browser', 'render'),
      core: path.join(__dirname, '..', 'browser', 'core'),
      store: path.join(__dirname, '..', 'browser', 'store'),
      lib: path.join(__dirname, '..', 'browser', 'lib'),
      resources: path.join(__dirname, '..', 'resources'),
      workers: path.join(__dirname, '..', 'browser', 'workers')
    }
  }
}

module.exports = config
