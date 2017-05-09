const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer (app, opts) {
  Object.keys(clientConfig.entry).forEach(function(name) {
    clientConfig.entry[name] = ['webpack-hot-middleware/client'].concat(clientConfig.entry[name])
})

  //浏览器端多入口
  clientConfig.output.filename = 'dist/[name]/[name].js'
  clientConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )

  // dev middleware
  const clientCompiler = webpack(clientConfig)
  const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
    stats: {
      colors: true,
      chunks: false
    }
  })
  app.use(devMiddleware)
  clientCompiler.plugin('done', () => {
    const fs = devMiddleware.fileSystem

    //在这里判断文件是否在内存中
    const msitePath = path.join(clientConfig.output.path, 'msite.html')//client ssr 页面
    if (fs.existsSync(msitePath)) {
      const index = fs.readFileSync(msitePath, 'utf-8')
      opts.msiteUpdated(index)
    }
    const shopPath = path.join(clientConfig.output.path, 'shop.html')//client ssr 页面
    if (fs.existsSync(shopPath)) {
      const index = fs.readFileSync(shopPath, 'utf-8')
      opts.shopUpdated(index)
    }
  })

  // hot middleware
  app.use(require('webpack-hot-middleware')(clientCompiler))

  // watch and update server renderer
  const serverCompiler = webpack(serverConfig)
  const mfs = new MFS()
  // const outputPath = path.join(serverConfig.output.path, serverConfig.output.filename)
  serverCompiler.outputFileSystem = mfs
  serverCompiler.watch({}, (err, stats) => {
    if (err) throw err
    stats = stats.toJson()
    stats.errors.forEach(err => console.error(err))
    stats.warnings.forEach(err => console.warn(err))
    opts.msiteBundleUpdated(mfs.readFileSync(path.join(serverConfig.output.path, 'server/msite-server-bundle.js'), 'utf-8'))
    opts.shopBundleUpdated(mfs.readFileSync(path.join(serverConfig.output.path, 'server/shop-server-bundle.js'), 'utf-8'))

  })
}
