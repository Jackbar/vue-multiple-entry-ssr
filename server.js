process.env.VUE_ENV = 'server'
const isProd = process.env.NODE_ENV === 'production'

const fs = require('fs')
const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
const compression = require('compression')
const serialize = require('serialize-javascript')
const resolve = file => path.resolve(__dirname, file)

const app = express()

let msiteHTML // generated by html-webpack-plugin
let shopHTML // generated by html-webpack-plugin



let msiteRenderer  // created from the webpack-generated server bundle
let shopRenderer

if (isProd) {
  // in production: create server renderer and index HTML from real fs
  msiteRenderer = createRenderer(fs.readFileSync(resolve('./www/server/msite-server-bundle.js'), 'utf-8'))
  shopRenderer = createRenderer(fs.readFileSync(resolve('./www/server/shop-server-bundle.js'), 'utf-8'))

  msiteHTML = parseIndex(fs.readFileSync(resolve('./www/msite.html'), 'utf-8'))
  shopHTML = parseIndex(fs.readFileSync(resolve('./www/shop.html'), 'utf-8'))

} else {
  // in development: setup the dev server with watch and hot-reload,
  // and update renderer / index HTML on file change.
  require('./build/setup-dev-server')(app, {
    msiteBundleUpdated: bundle => {
      msiteRenderer = createRenderer(bundle)
    },
    shopBundleUpdated: bundle => {
      shopRenderer = createRenderer(bundle)
    },
    msiteUpdated: index => {
      msiteHTML = parseIndex(index)
    },
    shopUpdated: index => {
      shopHTML = parseIndex(index)
    }
  })
}

function createRenderer(bundle) {
  // https://github.com/vuejs/vue/blob/next/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return require('vue-server-renderer').createBundleRenderer(bundle, {
    cache: require('lru-cache')({
      max: 1000,
      maxAge: 1000 * 60 * 15
    })
  })
}

function parseIndex(template) {
  const contentMarker = '<!-- APP -->'
  const i = template.indexOf(contentMarker)
  return {
    head: template.slice(0, i),
    tail: template.slice(i + contentMarker.length)
  }
}

const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
})

app.use(compression({ threshold: 0 }))
app.use(favicon('./src/assets/img/logo-48.png'))
app.use('/manifest.json', serve('./manifest.json'))
app.use('/server', serve('./www/server'))
app.use('/static', serve('./www/static'))
app.use('/dist', serve('./www/dist'))

//msite
app.get(['/','/msite'], (req, res) => {
  if (!msiteRenderer) {
    return res.end('waiting for compilation... refresh in a moment.')
  }

  res.setHeader("Content-Type", "text/html");
  var s = Date.now()
  const context = { url: req.url }
  const renderStream = msiteRenderer.renderToStream(context)

  renderStream.once('data', () => {
    res.write(msiteHTML.head)
  })

  renderStream.on('data', chunk => {
    res.write(chunk)
  })

  renderStream.on('end', () => {
    // embed initial store state
    if (context.initialState) {
      res.write(
        `<script>window.__INITIAL_STATE__=${
          serialize(context.initialState, { isJSON: true })
          }</script>`
      )
    }
    res.end(msiteHTML.tail)
    console.log(`whole request: ${Date.now() - s}ms`)
  })

  renderStream.on('error', err => {
    if (err && err.code === '404') {
      res.status(404).end('404 | Page Not Found')
      return
    }
    // Render Error Page or Redirect
    res.status(500).end('Internal Error 500')
    console.error(`error during render : ${req.url}`)
    console.error(err)
  })
})
//shop
app.get(['/shop'], (req, res) => {
  if (!shopRenderer) {
    return res.end('waiting for compilation... refresh in a moment.')
  }

  res.setHeader("Content-Type", "text/html");
  var s = Date.now()
  const context = { url: req.url }
  const renderStream = shopRenderer.renderToStream(context)

  renderStream.once('data', () => {
    res.write(shopHTML.head)
  })

  renderStream.on('data', chunk => {
    res.write(chunk)
  })

  renderStream.on('end', () => {
    // embed initial store state
    if (context.initialState) {
      res.write(
        `<script>window.__INITIAL_STATE__=${
          serialize(context.initialState, { isJSON: true })
          }</script>`
      )
    }
    res.end(shopHTML.tail)
    console.log(`whole request: ${Date.now() - s}ms`)
  })

  renderStream.on('error', err => {
    if (err && err.code === '404') {
      res.status(404).end('404 | Page Not Found')
      return
    }
    // Render Error Page or Redirect
    res.status(500).end('Internal Error 500')
    console.error(`error during render : ${req.url}`)
    console.error(err)
  })
})

//其他路由404
app.get('*', (req, res) => {
  //res.render('404.html')
  res.send('HTTP STATUS: 404')
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`)
})