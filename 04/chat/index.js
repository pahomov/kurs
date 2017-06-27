const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const logger = require('koa-logger');

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(router.routes());
app.use(serve('public'));
app.listen(3000);

const clients = [];

router.get('/subscribe', async(ctx, next) => {
  ctx.status = 200;
  clients.push(ctx.res);

  await new Promise((resolve) => {
    ctx.res.on('close', function() {
      clients.splice(clients.indexOf(ctx.res), 1);
      resolve();
    });
  });
});

router.post('/publish', async(ctx, next) => {
  ctx.status = 200;
  let body = '';
  let message = '';

  ctx.req.on('data', (data) => {
    body += data;

    if (body.length > 512) {
      ctx.status = 413;
      ctx.res.end('message limit');
      next();
    }

    try {
      message = JSON.parse(body).message;
      if (!message) {
        throw new SyntaxError('No message');
      }
      message = String(message);
    } catch (e) {
      ctx.res.statusCode = 400;
      ctx.res.end('Bad Request');
      return;
    }
  });

  ctx.req.on('end', () => {
    if (ctx.status == 413) return;

    clients.forEach((res) => {
      res.end(message);
    });

    clients.length = 0;
  });
});

