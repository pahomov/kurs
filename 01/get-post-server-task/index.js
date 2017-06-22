/**
 ЗАДАЧА
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
   GET /file.ext [image.png, text.txt]
   - выдаёт файл file.ext из директории files,

   POST /file.ext []
   - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
   - если файл уже есть, то выдаёт ошибку 409
   - при превышении файлом размера 1MB выдаёт ошибку 413

   DELETE /file
   - удаляет файл
   - выводит 200 OK
   - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер
 должен выдавать ошибку 400.

- Сервер должен корректно обрабатывать ошибки "файл не найден"
  и другие (ошибка чтения файла)
- index.html или curl для тестирования

 */

// Пример простого сервера в качестве основы

'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const dir = 'public/';

const server = (req, res) => {
  const filePath = path.normalize(
    path.join(dir, decodeURI(url.parse(req.url).pathname)));

  const methodSwitch = {
    'GET': () => {
      if (filePath == dir) {
        fs.readFile(path.join(dir, 'index.html'), (err, content) => {
          if (err) throw err;
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.end(content);
        });
        return;
      } else {
        fs.stat(filePath, (err, stats) => {
          if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end('File not found');
            return;
          }

          res.statusCode = 200;
          const stream = new fs.ReadStream(filePath);
          stream.pipe(res);
          stream.on('error', (err) => {
            res.statusCode = 500;
            res.end('Server Error');
          });
          res.on('close', stream.destroy);
        });
      }
    },
    'POST': () => {
      if (fs.existsSync(filePath)) {
        res.statusCode = 409;
        res.end('File already exists');
        return;
      }

      const stream = fs.createWriteStream(filePath, {flags: 'wx'});
      let l = 0;
      req.on('data', (buf) => {
        l += buf.length;
        if (l > 1048576) {
          stream.destroy();
          fs.unlink(filePath);
          res.statusCode = 413;
          res.end('Accept only file less than 1 MB');
        }
      });
      req.pipe(stream);
      req.on('end', () => {
        res.statusCode = 200;
        res.end('OK');
      });
      // stream.on('close', () => {
      //   if (l > 1048576) {
      //     fs.unlink(filePath, (err) => {
      //       if (err) throw err;
      //     });
      //   }
      // });
      stream.on('error', (err) => {
        res.statusCode = 500;
        res.end('Server Error');
      });
      res.on('close', stream.destroy);
    },
    'DELETE': () => {
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }

        fs.unlink(filePath, (err) => {
          if (err) throw err;

          res.statusCode = 200;
          res.end('File deleted');
        });
      });
    },
  };

  (methodSwitch[req.method] || (() => {
    res.statusCode = 502;
    res.end(req.method, ' method not implemented');
  }))();
};

http.createServer(server).listen(3000);
