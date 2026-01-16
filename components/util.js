const Mime = require('mime/lite').Mime

// load standard and other mime types
const standardTypes = require('mime/types/standard.js').default
const otherTypes = require('mime/types/other.js').default

// define eXist-db specific mime types
const customTypes = {
  'application/xquery': ['xq', 'xqs', 'xquery', 'xql', 'xqm'],
  'application/xml': ['xconf', 'odd']
}

// create custom mime instance
const mime = new Mime(standardTypes, otherTypes, customTypes)

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
  getMimeType,
  mime
}
