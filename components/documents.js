var mime = require('mime')

function upload (client, contentBuffer) {
  return client.promisedMethodCall('upload', [contentBuffer, contentBuffer.length])
}

function parseLocal (client, handle, filename, options) {
  // set default values
  var mimeType = options.mimetype || mime.lookup(filename)
  var replace = options.replace || true

  return client.promisedMethodCall('parseLocal', [handle, filename, replace, mimeType])
}

function read (client, documentName, options) {
  return client.promisedMethodCall('getDocument', [documentName, options])
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
