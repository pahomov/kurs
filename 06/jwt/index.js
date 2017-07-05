// задача jwt авторизация на passport
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const jwt = require('koa-jwt');
const jwtSimple = require('jwt-simple');

const router = new Router();

new Koa().use(logger()).use(bodyParser()).use(router.routes()).listen(3000);

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/test');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('user', userSchema);

const secret = 'ffffuuuuuuuuuuu';
const restrictAccess = () => jwt({ secret, cookie: 'access_token' });

// закрытый авторизацией раздел - отдаем юзера
router.get('/private', restrictAccess(), async (ctx, next) => {
  ctx.body = ctx.state.user;
  ctx.status = 200;
});

// вход - токен кладем куку
router.post('/login', async (ctx, next) => {
  const { email, password } = ctx.request.body;
  const users = await User.find({ email, password }).catch(console.log);

  if (!users.length) {
    ctx.status = 400;
  } else {
    const user = users[0];
    const token = jwtSimple.encode({ user }, secret);
    ctx.cookies.set('access_token', token, { httpOnly: false });
    ctx.status = 200;
  }
});

// выход - очищаем куку
router.post('/logout', async (ctx, next) => {
  ctx.cookies.set('access_token', '', { httpOnly: false });
  ctx.status = 200;
});

// дальше старый код, не интересно

router.post('/users', async (ctx, next) => {
  await User.create(ctx.request.body).catch(console.log);
  ctx.status = 200;
});

router.get('/users', async (ctx, next) => {
  const users = await User.find({}).catch(console.log);
  ctx.body = users;
  ctx.status = 200;
});

router.get('/users/:id', async (ctx, next) => {
  const user = await User.findById(ctx.params.id).catch(console.log);
  if (!user) {
    ctx.body = 'ʕ´◕ᴥ◕`ʔ user not found';
    ctx.status = 404;
  } else {
    ctx.body = user;
    ctx.status = 200;
  }
});

router.patch('/users/:id', async (ctx, next) => {
  await User.findById(ctx.params.id).catch(console.log);
  user.email = ctx.request.body.email;
  user.password = ctx.request.body.password;
  await user.save();
  ctx.status = 200;
});

router.delete('/users/:id', async (ctx, next) => {
  await User.findByIdAndRemove(ctx.params.id).catch(console.log);
  ctx.status = 200;
});
