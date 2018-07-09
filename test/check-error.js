'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var PullStream = require('../lib/PullStream');

test("Finish not emitted if there is an error", function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  var p = PullStream();
  var finishEmitted = false;

  fs.createReadStream(archive)
    .pipe(p)
    .on('error', function(e) {
      t.same(e.message,'FILE_ENDED');
      setTimeout(function() {
        t.same(finishEmitted,false);
        t.end();
      },100);
    })
    .on('finish', function() {
      finishEmitted = true;
    })
    .on('close', function() {
      finishEmitted = true;
    });

  p.stream('something_not_found');
});
