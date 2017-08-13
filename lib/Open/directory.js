var PullStream = require('../PullStream');
var Promise = require('bluebird');
var BufferStream = require('../BufferStream');
var read = require('../read');

var signature = Buffer(4);
signature.writeUInt32LE(0x06054b50,0);

module.exports = function centralDirectory(source) {
  var endDir = PullStream(),
      records = PullStream();

  return source.size()
    .then(function(size) {
      source.stream(size-40).pipe(endDir);
      return endDir.pull(signature);
    })
    .then(function() {
      return read.endOfDirectory(endDir);
    })
    .then(function(vars) {
      Object.defineProperty(vars,'source',{value: source});
      source.stream(vars.offsetToStartOfCentralDirectory).pipe(records);

      vars.files = Promise.mapSeries(Array(vars.numberOfRecords),function() {
        return read.directoryFileHeader(records)
          .then(function(file) {
            file.stream = function(_password, _raw) {
              var input = source.stream(file.offsetToLocalFileHeader);
              var output = read.fileStream(input.pipe(PullStream()),{password:_password, raw: _raw});

              input.on('error',function(err) {
                output.emit('error',err);
              });
                
              return output;
            };

            file.buffer = function(_password) {
              return BufferStream(file.stream(_password));
            };
            return file;
          });
      });

      return Promise.props(vars);
    });

    
};
