// ЗАДАЧА - прочитать все файлы текущей директории, используя новый readfile
// (последовательно или параллельно - как считаете нужным)
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const myFunction = (path) => readdir(path)
  .then((res) => res.map((file) => readFile(file, 'utf8')))
  .then((res) => Promise.all(res))
  .catch(console.log);

myFunction(__dirname).then(console.log);
