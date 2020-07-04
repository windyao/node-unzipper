'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var Stream = require('stream');
var unzip = require('../');

test("verify that async-iterator captures all entries", async function (t) {
  var archive = path.join(__dirname, '../testData/compressed-standard/archive.zip');

  const zip = fs.createReadStream(archive)
    .pipe(unzip.Parse({ forceStream: true }))

  var entries = 0;
  
  for await (const entry of zip) {
    entries++;
    await new Promise(resolve => setTimeout(resolve,100));
    entry.autodrain();
  }

  t.same(entries,3,'should capture all 3 entries');
  t.end();
});
