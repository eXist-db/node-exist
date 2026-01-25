import { Mime } from 'mime/lite'
import standardTypes from 'mime/types/standard.js'
import otherTypes from 'mime/types/other.js'

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
export function getMimeType (path, mimetype) {
  return mimetype || mime.getType(path) || 'application/octet-stream'
}

export {
  mime
}
