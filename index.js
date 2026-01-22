import { mime } from './components/util.js'

// components
import * as connection from './components/connection.js'
import * as database from './components/database.js'
import * as queries from './components/queries.js'
import * as resources from './components/resources.js'
import * as documents from './components/documents.js'
import * as collections from './components/collections.js'
import * as indices from './components/indices.js'
import * as users from './components/users.js'
import * as app from './components/app.js'
import * as rest from './components/rest.js'

/**
 * @typedef { import("./components/connection").NodeExistConnectionOptions } NodeExistConnectionOptions
 */
/**
 * @typedef { import("./compontents/xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */
/**
 * @typedef {Object} NodeExist
 * @prop {XmlRpcClient} client
 * @prop {{shutdown:function, syncToDisk:function}} server
 * @prop {{read:function, readAll:function, execute:function, count:function, retrieve:function, retrieveAll:function, releaseResult:function}} queries
 * @prop {{describe:function, setPermissions:function, getPermissions:function}} resources
 * @prop {{upload:function, parseLocal:function, read:function, remove:function}} documents
 * @prop {{create:function, remove:function, describe:function, read:function}} collections
 * @prop {Object} indices
 * @prop {{getUserInfo:function, list:function}} users
 * @prop {{install:function, upload:function, deploy:function, remove:function}} app
 */

/**
/**
 * @typedef { import("got").Got } Got
 */
/**
 * @typedef {Object} RestClient
 * @prop {Got} restClient the REST client to interact with the database
 * @prop {function} get retrieve resources via HTTP GET
 * @prop {function} put store resources via HTTP PUT
 * @prop {function} post send resources via HTTP POST
 * @prop {function} del remove resources via HTTP DELETE
 */

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
export function connect (options) {
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

/**
 * Get a REST client to interact with an exist-db instance
 * @param {NodeExistConnectionOptions} options the connection options
 * @returns {RestClient} the REST client
 */
export async function getRestClient (options) {
  const restClient = await connection.restConnection(options)
  const { get, put, post, del } = applyEachWith(rest, restClient)

  return {
    restClient,
    get,
    put,
    post,
    del
  }
}

export const readOptionsFromEnv = connection.readOptionsFromEnv
export function defineMimeTypes (mimeTypes) {
  mime.define(mimeTypes)
}

export function getMimeType (path) {
  return mime.getType(path)
}
