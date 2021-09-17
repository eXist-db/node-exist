const mime = require('mime')

function upload (client, contentBuffer) {
  return client.promisedMethodCall('upload', [contentBuffer, contentBuffer.length])
}

function parseLocal (client, handle, filename, options) {
  // set default values
  const mimeType = options.mimetype || mime.getType(filename)
  const replace = options.replace || true

  return client.promisedMethodCall('parseLocal', [handle, filename, replace, mimeType])
}

function read (client, documentName, options) {
  return client.promisedMethodCall('getDocument', [documentName, options])
}

function remove (client, documentName) {
  return client.promisedMethodCall('remove', [documentName])
}

module.exports = {
  upload,
  parseLocal,
  read,
  remove
}
