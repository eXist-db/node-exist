const mime = require('mime')

/**
 * determine mimetype from path, allowing override
 * @param {string} path database path
 * @param {string | undefined} [mimetype] mimetype to enforce
 * @returns {string} mimetype, defaults to 'application/octet-stream'
 */
function getMimeType (path, mimetype) {
  return mimetype || mime.getType(path) || 'application/octet-stream'
}

module.exports = {
  getMimeType
}
