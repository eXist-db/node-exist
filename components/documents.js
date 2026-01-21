import { getMimeType } from './util.js'

function upload (client, contentBuffer) {
  return client.methodCall('upload', [contentBuffer, contentBuffer.length])
}

function parseLocal (client, handle, filename, options = {}) {
  // set default values
  const mimeType = getMimeType(filename, options && options.mimetype ? options.mimetype : null)
  const replace = options && options.replace ? options.replace : true

  return client.methodCall('parseLocal', [handle, filename, replace, mimeType])
}

function read (client, documentName, options = {}) {
  return client.methodCall('getDocument', [documentName, options])
}

function readBinary (client, documentName) {
  return client.methodCall('getBinaryResource', [documentName])
}

function remove (client, documentName) {
  return client.methodCall('remove', [documentName])
}

export {
  upload,
  parseLocal,
  read,
  readBinary,
  remove
}
