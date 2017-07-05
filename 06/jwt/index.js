// задача jwt авторизация на passport
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/test');

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.listen(3000);

const jwtConfig = {
    jwtSecret: 'MyS3cr3tK3Y',
    jwtSession: {
        session: false,
    },
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('user', userSchema);

router.post('/users', async(ctx, next) => {
  await User.create(ctx.request.body).catch(console.log);
  ctx.status = 200;
});

router.get('/users', async(ctx, next) => {
  const users = await User.find({}).catch(console.log);
  ctx.body = users;
  ctx.status = 200;
});

router.get('/users/:id', async(ctx, next) => {
  const user = await User.findById(ctx.params.id).catch(console.log);
  if (!user) {
    ctx.body = 'ʕ´◕ᴥ◕`ʔ user not found';
    ctx.status = 404;
  } else {
    ctx.body = user;
    ctx.status = 200;
  }
});

router.patch('/users/:id', async(ctx, next) => {
  await User.findById(ctx.params.id).catch(console.log);
  user.email = ctx.request.body.email;
  user.password = ctx.request.body.password;
  await user.save();
  ctx.status = 200;
});

router.delete('/users/:id', async(ctx, next) => {
  await User.findByIdAndRemove(ctx.params.id).catch(console.log);
  ctx.status = 200;
});
