const { getMimeType } = require('./util')

function upload (client, contentBuffer) {
  return client.promisedMethodCall('upload', [contentBuffer, contentBuffer.length])
}

function parseLocal (client, handle, filename, options) {
  // set default values
  const mimeType = getMimeType(filename, options && options.mimetype ? options.mimetype : null)
  const replace = options && options.replace ? options.replace : true

  return client.promisedMethodCall('parseLocal', [handle, filename, replace, mimeType])
}

function read (client, documentName, options) {
  return client.promisedMethodCall('getDocument', [documentName, options])
}

function readBinary (client, documentName) {
  return client.promisedMethodCall('getBinaryResource', [documentName])
}

function remove (client, documentName) {
  return client.promisedMethodCall('remove', [documentName])
}

module.exports = {
  upload,
  parseLocal,
  read,
  readBinary,
  remove
}
