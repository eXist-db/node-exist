import { getMimeType } from './util.js'

/**
 *  @typedef { import("./xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */

/**
 * Upload a document to the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Buffer} contentBuffer the buffer to upload
 * @returns {Promise<string>} document handle
 */
function upload (client, contentBuffer) {
  return client.methodCall('upload', [contentBuffer, contentBuffer.length])
}

/**
 * Parse bytes uploeded to the database to a document
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} handle upload handle
 * @param {string} filename local filename
 * @param {{mimetype: string, replace: boolean}} [options] override mimetype and disallow replacing an existing document
 * @returns {Promise<string>} document name/path in the database
 */
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
