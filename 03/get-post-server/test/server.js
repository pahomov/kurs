// ЗАДАЧА - переписать тесты на async/await
const server = require('../server');
const rp = require('request-promise');
const fs = require('mz/fs');
const assert = require('assert');
const util = require('util');
const unlink = util.promisify(fs.unlink);

const serverUrl = 'http://localhost:8888/';

describe('server tests', () => {
  let app;
  before((done) => {
    app = server.listen(8888, done);
  });

  after((done) => {
    app.close(done);
  });

  it('GET index.html', async() => {
    const body = await rp(serverUrl);
    assert.equal(body, fs.readFileSync('public/index.html'));
  });

  it('save file on POST', async() => {
    const response = await rp.post({
      url: serverUrl+'file',
      body: 'content',
      resolveWithFullResponse: true,
    });

    assert.equal('content', fs.readFileSync('files/file', 'utf8'));
    fs.unlink('files/file', () => {});
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, 'OK');
  });

  it('emit error 409 if file exists', async() => {
    fs.writeFileSync('files/file2', '', 'utf8');
    const response = await rp.post({
      url: serverUrl+'file2',
      body: '',
      resolveWithFullResponse: true,
      simple: false,
    });

    fs.unlink('files/file2', () => {});
    assert.equal(response.statusCode, 409);
    assert.equal(response.body, 'File exists');
  });

  it('delete file and emit status 200', async() => {
    fs.writeFileSync('files/file3', '', 'utf8');

    const response = await rp.del({
      url: serverUrl+'file3',
      resolveWithFullResponse: true,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, 'OK');

    const unlinkErr = await unlink('files/file3').catch((e) => e);
    assert.equal(unlinkErr.code, 'ENOENT');
  });

  it('emits error 404 if file not found on DELETE', async() => {
    const response = await rp.del({
      url: serverUrl+'nofile',
      resolveWithFullResponse: true,
      simple: false,
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.body, 'Not found');
  });

  it('emits error 404 if file not found on GET', async() => {
    const response = await rp({
      url: serverUrl+'nofile',
      resolveWithFullResponse: true,
      simple: false,
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.body, 'Not found');
  });

  it('emit error 400 if path contains /', async() => {
    const response = await rp({
      url: serverUrl+'..',
      resolveWithFullResponse: true,
      simple: false,
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body, 'Nested paths are not allowed');
  });

  it('emit error 400 if path contains ..', async() => {
    const response = await rp({
      url: serverUrl+'/',
      resolveWithFullResponse: true,
      simple: false,
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body, 'Nested paths are not allowed');
  });

  it('emit error 413 if file is larger than 1MB', async() => {
    const response = await rp.post({
      url: serverUrl+'bigfile',
      body: fs.createReadStream('test/bigMockFile'),
      resolveWithFullResponse: true,
      simple: false,
    });

    assert.equal(response.statusCode, 413);
    assert.equal(response.body, 'File is too big!');

    const unlinkErr = await unlink('files/bigfile').catch((e) => e);
    assert.equal(unlinkErr.code, 'ENOENT');
  });
});
