/*
REST-сервис для юзеров на Koa.JS + Mongoose
User имеет уникальный email, а также даты создания и модификации
и имя displayName.
GET /users/:id - получить юзера по id, например: /users/57ffe7300b863737ddfe9a39
GET /users - получить массив юзеров
POST /users - создать пользователя
  Метод POST позволяет указать только email и displayName (нельзя при создании
  юзера указать его _id)
PATCH /users/:id - модифицировать пользователя
  Метод PATCH позволяет поменять только email и displayName (нельзя при создании
  юзера указать его _id)
DELETE /users/:id - удалить пользователя
Если юзера с данным :id нет:
   метод возвращает 404
Если ошибка валидации (напр. не указан email) или уникальности:
  метод возвращает 400 и объект с ошибками вида { errors: { field: error } }
  пример: {errors: {email: 'Такой email уже есть'}}
Желательно, с тестами.
*/
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/test');
mongoose.plugin(beautifyUnique);

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.listen(3000);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: 'Укажите email',
    unique: 'Такой email уже есть',
  },
});

userSchema.methods.getPublicFields = function() {
  return {
    email: this.email,
  };
};

const User = mongoose.model('user', userSchema);

router.post('/users', async(ctx, next) => {
  await User.create(ctx.request.body).then(() => {
    ctx.status = 200;
  }).catch(({errors}) => {
    ctx.status = 400;
    ctx.body = Object.entries(errors)
      .reduce((acc, [key, {message}]) =>
        Object.assign(acc, {[key]: message}), {});
  });
});

router.get('/users', async(ctx, next) => {
  await User.find({}).then((res) => {
    ctx.body = res;
    ctx.status = 200;
  }).catch(console.log);
});

router.get('/users/:id', async(ctx, next) => {
  await User.findById(ctx.params.id).then((res) => {
    if (!res) {
      ctx.body = 'ʕ´◕ᴥ◕`ʔ user not found';
      ctx.status = 404;
    } else {
      ctx.body = res;
      ctx.status = 200;
    }
  }).catch(console.log);
});

router.patch('/users/:id', async(ctx, next) => {
  await User.findById(ctx.params.id).then((user) => {
    user.email = ctx.request.body.email;
    user.save();
    ctx.status = 200;
  }).catch(console.log);
});

router.delete('/users/:id', async(ctx, next) => {
  await User.findByIdAndRemove(ctx.params.id).then((user) => {
    ctx.status = 200;
  }).catch(console.log);
});
