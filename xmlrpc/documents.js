import { getMimeType } from '../util/mime.js'

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

/**
 * read a document from the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} documentName the name/path of the document
 * @param {Object} options additional options
 * @returns {Promise<string>} document contents as a string
 */
function read (client, documentName, options = {}) {
  return client.methodCall('getDocument', [documentName, options])
}

/**
 * read a binary document from the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} documentName the name/path of the document
 * @returns {Promise<Buffer>} document contents as a Buffer
 */
function readBinary (client, documentName) {
  return client.methodCall('getBinaryResource', [documentName])
}

/**
 * remove a document from the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} documentName the name/path of the document
 * @returns {Promise<boolean>} true when the document was removed
 */
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
