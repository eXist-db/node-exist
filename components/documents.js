var mime = require('mime')

function upload (client, contentBuffer) {
  return new Promise(function (resolve, reject) {
    client.methodCall('upload', [contentBuffer, contentBuffer.length], function (error, fileHandle) {
      if (error) {
        return reject(error)
      }
      resolve(fileHandle)
    })
  })
}

function parseLocal (client, handle, filename, options) {
  // set default values
  var mimetype = options.mimetype || mime.lookup(filename)
  var replace = options.replace || true

  return new Promise(function (resolve, reject) {
    client.methodCall('parseLocal', [handle, filename, replace, mimetype], function (error, result) {
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

function read (client, documentName, options) {
  return new Promise(function (resolve, reject) {
    client.methodCall('getDocument', [documentName, options], function (error, result) {
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

function remove (client, documentName) {
  return new Promise(function (resolve, reject) {
    client.methodCall('removeResource', [documentName], function (error, result) {
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

module.exports = {
  upload: upload,
  parseLocal: parseLocal,
  read: read,
  remove: remove
}
