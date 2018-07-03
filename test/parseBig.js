'use strict';

var test = require('tap').test;
var path = require('path');
var unzip = require('../');
var NoopStream = require('../lib/NoopStream');

test("File error should propagate to stream", {timeout: 640000}, function (t) {

  process.on('uncaughtException', function(e) {
    t.error(new Error('Uncaught Exception: '+e.message));
    t.end();
  });

  var archive = path.join(__dirname, '../testData/big.zip');
  unzip.Open.file(archive)
    .then(function(d) {
      var f = d.files[0].stream();
      f.on('error', function(e) {
        t.equal(e.message,'FILE_ENDED');
        t.end();
      })
      .on('end', function() {
        t.error(new Error('Error not caught'));
        t.end();
      })
      .pipe(NoopStream());
    });
});
