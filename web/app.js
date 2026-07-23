const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname: '0.0.0.0', port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('> Jigawa PDP PollWatch Web Command Dashboard listening on http://0.0.0.0:3000');
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
