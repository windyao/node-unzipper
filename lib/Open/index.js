var fs = require('fs');
var Promise = require('bluebird');
var directory = require('./directory');
var Stream = require('stream');

// Backwards compatibility for node versions < 8
if (!Stream.Writable || !Stream.Writable.prototype.destroy)
  Stream = require('readable-stream');

module.exports = {
  buffer: function(buffer, options) {
    var source = {
      stream: function(offset, length) {
        var stream = Stream.PassThrough();
        stream.end(buffer.slice(offset, length));
        return stream;
      },
      size: function() {
        return Promise.resolve(buffer.length);
      }
    };
    return directory(source, options);
  },
  file: function(filename, options) {
    var source = {
      stream: function(offset,length) {
        return fs.createReadStream(filename,{start: offset, end: length && offset+length});
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
    };
    return directory(source, options);
  },

  url: function(request,options) {
    if (typeof options === 'string')
      options = {url: options};
    if (!options.url)
      throw 'URL missing';
    options.headers = options.headers || {};

    var source = {
      stream : function(offset,length) {
        var streamOptions = Object.create(options);
        streamOptions.headers = Object.create(options.headers);
        streamOptions.headers.range = 'bytes='+offset+'-' + (length ? length : '');
        return request(streamOptions);
      },
      size: function() {
        return new Promise(function(resolve,reject) {
          var req = request(options);
          req.on('response',function(d) {
            req.abort();
            resolve(d.headers['content-length']);
          }).on('error',reject);
        });
      }
    };

    return directory(source, options);
  },

  s3 : function(client,options) {
    var source = {
      size: function() {
        return new Promise(function(resolve,reject) {
          client.headObject(options, function(err,d) {
            if (err)
              reject(err);
            else
              resolve(d.ContentLength);
          });
        });
      },
      stream: function(offset,length) {
        var d = {};
        for (var key in options)
          d[key] = options[key];
        d.Range = 'bytes='+offset+'-' + (length ? length : '');
        return client.getObject(d).createReadStream();
      }
    };

    return directory(source, options);
  }
};