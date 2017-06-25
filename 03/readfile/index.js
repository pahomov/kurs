// ЗАДАЧА - прочитать все файлы текущей директории, используя новый readfile
// (последовательно или параллельно - как считаете нужным)
const fs = require('mz/fs');

const myFunction = (path) => fs.readdir(path)
  .then((res) => res.map((file) => fs.readFile(file, 'utf8')))
  .then((res) => Promise.all(res))
  .catch(console.log);

myFunction(__dirname).then(console.log);
