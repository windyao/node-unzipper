'use strict';

var test = require('tap').test;
var fs = require('fs');
var path = require('path');
var unzip = require('../');
var directory = require('../lib/Open/directory');
var Stream = require('stream');

test('errors', {autoend:true}, function(t) {
  t.test('at stream opening', function (t) {
    var archive = path.join(__dirname, '../testData/compressed-standard/file-doesnt-exists.zip');

    return unzip.Open.file(archive)
      .then(function() {
        throw new Error('Should Error');
      },function(e) {
        t.equal(e.code,'ENOENT');
      })
      .finally(function() {
        t.end();
      });
  });

  t.test('inside filestream', {autoend: true}, function(t) {
    var filename = path.join(__dirname, '../testData/compressed-standard/archive.zip');

    function failOpen(emit,msg) {
      return directory({
        stream: function(offset,length) {
          var map = Stream.Transform();
          map._transform = function(d,e,cb) {
            if (offset < 1000) {
              this.push(d.slice(0,20));
              this.emit(emit,msg);
              cb();
            } else {
              cb(null,d);
            }
          };

          return fs.createReadStream(filename,{start: offset, end: length && offset+length})
            .pipe(map);
        },
        size: function() {
          return new Promise(function(resolve,reject) {
            fs.stat(filename,function(err,d) {
              if (err)
                reject(err);
              else
                resolve(d.size);
            });
          });
        }
      });
    }

    t.test('file errors',function(t) {
      return failOpen('error',{message: 'timeout'})
        .then(function(dir) {
          return dir.files[0].buffer();
        })
        .then(function() {
          throw new Error('Should Throw');
        },function(e) {
          t.same(e.message,'timeout');
        });
    });

    t.test('file ends prematurely',function(t) {
      return failOpen('end')
        .then(function(dir) {
          return dir.files[0].buffer();
        })
        .then(function() {
          throw new Error('Should Throw');
        },function(e) {
          t.same(e.message,'FILE_ENDED');
        });
    });
  });
});