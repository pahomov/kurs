// задача доработать чат (поработать с websockets)

const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const jwt = require('koa-jwt');
const jwtSimple = require('jwt-simple');
const send = require('koa-send');
const IO = require('koa-socket');

const router = new Router();
const io = new IO();
const app = new Koa();
app.use(logger());
app.use(bodyParser());
app.use(router.routes());
io.attach(app);
app.listen(3000);

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/test');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('user', userSchema);

const logSchema = new mongoose.Schema({
  message: { type: String, required: true },
  user: { type: String, required: true },
});
const Log = mongoose.model('log', logSchema);

const secret = 'ffffuuuuuuuuuuu';
const restrictAccess = () => jwt({ secret, cookie: 'access_token' });

io.on('message', async (ctx, data) => {
  const m = {
    message: data.message,
    user: jwtSimple.decode(data.jwt, secret).user.email,
  };
  io.broadcast('message', m);
  await Log.create(m).catch(console.log);
});

router.get('/', async ctx => {
  await send(ctx, 'static/login.html');
});

router.get('/chat', restrictAccess(), async ctx => {
  await send(ctx, 'static/chat.html');
});

router.get('/log', restrictAccess(), async ctx => {
  const log = await Log.find({}).catch(console.log);
  ctx.body = log;
});

router.post('/login', async ctx => {
  const { email, password } = ctx.request.body;
  const users = await User.find({ email, password }).catch(console.log);

  if (!users.length) {
    ctx.status = 400;
  } else {
    const user = users[0];
    const token = jwtSimple.encode({ user }, secret);
    ctx.cookies.set('access_token', token, { httpOnly: false });
    ctx.redirect('/chat');
  }
});

router.get('/logout', async ctx => {
  ctx.cookies.set('access_token', '', { httpOnly: false });
  ctx.redirect('/');
});

router.post('/users', async ctx => {
  await User.create(ctx.request.body).catch(console.log);
  ctx.status = 200;
});

router.get('/users', async ctx => {
  const users = await User.find({}).catch(console.log);
  ctx.body = users;
  ctx.status = 200;
});

router.get('/users/:id', async ctx => {
  const user = await User.findById(ctx.params.id).catch(console.log);
  if (!user) {
    ctx.body = 'ʕ´◕ᴥ◕`ʔ user not found';
    ctx.status = 404;
  } else {
    ctx.body = user;
    ctx.status = 200;
  }
});

router.patch('/users/:id', async ctx => {
  await User.findById(ctx.params.id).catch(console.log);
  user.email = ctx.request.body.email;
  user.password = ctx.request.body.password;
  await user.save();
  ctx.status = 200;
});

router.delete('/users/:id', async ctx => {
  await User.findByIdAndRemove(ctx.params.id).catch(console.log);
  ctx.status = 200;
});
