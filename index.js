/**
 * @typedef { import("./components/connection").NodeExistConnectionOptions } NodeExistConnectionOptions
 */
/**
 * @typedef {Object} NodeExist
 * @prop { import("xmlrpc").Client } client
 * @prop {{shutdown:function, syncToDisk:function}} server
 * @prop {{read:function, readAll:function, execute:function, count:function, retrieve:function, retrieveAll:function, releaseResult:function}} queries
 * @prop {{describe:function, setPermissions:function, getPermissions:function}} resources
 * @prop {{upload:function, parseLocal:function, read:function, remove:function}} documents
 * @prop {{create:function, remove:function, describe:function, read:function}} collections
 * @prop {Object} indices
 * @prop {{getUserInfo:function, list:function}} users
 * @prop {{install:function, upload:function, deploy:function, remove:function}} app
 */

const mime = require('mime')

// components
const connection = require('./components/connection')
const database = require('./components/database')
const queries = require('./components/queries')
const resources = require('./components/resources')
const documents = require('./components/documents')
const collections = require('./components/collections')
const indices = require('./components/indices')
const users = require('./components/users')
const app = require('./components/app')

// exist specific mime types
mime.define({
  'application/xquery': ['xq', 'xqs', 'xquery', 'xql', 'xqm'],
  'application/xml': ['xconf', 'odd']
})

// helper functions

function applyWith (func, client) {
  return function () {
    const args = Array.prototype.slice.call(arguments)
    return func.apply(null, [client].concat(args))
  }
}

function applyEachWith (module, client) {
  const applied = {}
  for (const property in module) {
    const value = module[property]
    // leave non-functions untouched
    if (typeof value !== 'function') {
      applied[property] = value
      continue
    }
    applied[property] = applyWith(value, client)
  }
  return applied
}

/**
  * Receive set of bound components to interact with an exist-db instance
  * @param {NodeExistConnectionOptions} options set who connects to which server and how
  * @returns {NodeExist} bound components to interact with an exist-db instance
  */
function connect (options) {
  const client = connection.connect(options)

  return {
    client,
    server: applyEachWith(database, client),
    queries: applyEachWith(queries, client),
    resources: applyEachWith(resources, client),
    documents: applyEachWith(documents, client),
    collections: applyEachWith(collections, client),
    indices: applyEachWith(indices, client),
    users: applyEachWith(users, client),
    app: applyEachWith(app, client)
  }
}

exports.readOptionsFromEnv = connection.readOptionsFromEnv
exports.connect = connect
exports.defineMimeTypes = function (mimeTypes) {
  mime.define(mimeTypes)
}

exports.getMimeType = function (path) {
  return mime.getType(path)
}
