const { createServer } = require('http')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, hostname: '0.0.0.0', port: 3000 })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err
    console.log('> Jigawa PDP PollWatch Web Command Dashboard ready on http://0.0.0.0:3000')
  })
})
