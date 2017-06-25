const server = require('../server');
const request = require('request');
const fs = require('mz/fs');
const assert = require('assert');

const serverUrl = 'http://localhost:8888/';

describe('server tests', () => {
  let app;
  before((done) => {
    app = server.listen(8888, done);
  });

  after((done) => {
    app.close(done);
  });

  it('GET index.html', (done) => {
    request(serverUrl, (error, response, body) => {
      if (error) return done(error);

      const fileContent = fs.readFileSync('public/index.html');

      assert.equal(body, fileContent);
      done();
    });
  });

  it('save file on POST', (done) => {
    request.post({url: serverUrl+'file', body: 'content'},
      (error, response, body) => {
        if (error) return done(error);

        const fileContent = fs.readFileSync('files/file', 'utf8');

        assert.equal('content', fileContent);
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, 'OK');

        fs.unlink('files/file', () => {});
        done();
      });
  });

  it('emit error 409 if file exists', (done) => {
    fs.writeFileSync('files/file2', '', 'utf8');

    request.post({url: serverUrl+'file2', body: ''},
      (error, response, body) => {
        if (error) return done(error);

        assert.equal(response.statusCode, 409);
        assert.equal(response.body, 'File exists');

        fs.unlink('files/file2', () => {});
        done();
      });
  });

  it('delete file and emit status 200', (done) => {
    fs.writeFileSync('files/file3', '', 'utf8');

    request.del({url: serverUrl+'file3'},
      (error, response, body) => {
        if (error) return done(error);

        assert.equal(response.statusCode, 200);
        assert.equal(response.body, 'OK');

        fs.unlink('files/file3', (err) => {
          assert.equal(err.code, 'ENOENT');
        });
        done();
      });
  });

  it('emits error 404 if file not found on DELETE', (done) => {
    request.del(serverUrl+'nofile', (error, response, body) => {
      if (error) return done(error);

      assert.equal(response.statusCode, 404);
      assert.equal(response.body, 'Not found');
      done();
    });
  });

  it('emits error 404 if file not found on GET', (done) => {
    request(serverUrl+'nofile', (error, response, body) => {
      if (error) return done(error);

      assert.equal(response.statusCode, 404);
      assert.equal(response.body, 'Not found');
      done();
    });
  });

  it('emit error 400 if path contains /', (done) => {
    request(serverUrl+'..', (error, response, body) => {
      if (error) return done(error);

      assert.equal(response.statusCode, 400);
      assert.equal(response.body, 'Nested paths are not allowed');
      done();
    });
  });

  it('emit error 400 if path contains ..', (done) => {
    request(serverUrl+'/', (error, response, body) => {
      if (error) return done(error);

      assert.equal(response.statusCode, 400);
      assert.equal(response.body, 'Nested paths are not allowed');
      done();
    });
  });

  it('emit error 413 if file is larger than 1MB', (done) => {
    request.post({
      url: serverUrl+'bigfile',
      body: fs.createReadStream('test/bigMockFile'),
    },
      (error, response, body) => {
        if (error) return done(error);

        assert.equal(response.statusCode, 413);
        assert.equal(response.body, 'File is too big!');

        fs.unlink('files/bigfile', (err) => {
          assert.equal(err.code, 'ENOENT');
        });

        done();
      });
  });
});
