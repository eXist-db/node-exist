import { mime } from './components/util.js'

// components
import * as connect from './components/connection.js'
import * as database from './components/database.js'
import * as queries from './components/queries.js'
import * as resources from './components/resources.js'
import * as documents from './components/documents.js'
import * as collections from './components/collections.js'
import * as indices from './components/indices.js'
import * as users from './components/users.js'
import * as app from './components/app.js'
import * as rest from './components/rest-client.js'

/**
 * @typedef { import("./components/connection").NodeExistConnectionOptions } NodeExistConnectionOptions
 */
/**
 * @typedef { import("./components/xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */
/**
 * @typedef { import("./components/undici-exist-client.js").Connection } Connection
 */
/**
 * @typedef {Object} NodeExistXmlRpcClient
 * @prop {Connection} connection underlying connection
 * @prop {function} methodCall
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
 * @typedef {Object} NodeExistRestClient
 * @prop {Connection} connection underlying connection
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
  * @returns {NodeExistXmlRpcClient} bound components to interact with an exist-db instance
  */
export function getXmlRpcClient (options) {
  const xmlrpc = connect.xmlrpc(options)
  const { connection, methodCall } = xmlrpc
  return {
    connection,
    methodCall,
    server: applyEachWith(database, xmlrpc),
    queries: applyEachWith(queries, xmlrpc),
    resources: applyEachWith(resources, xmlrpc),
    documents: applyEachWith(documents, xmlrpc),
    collections: applyEachWith(collections, xmlrpc),
    indices: applyEachWith(indices, xmlrpc),
    users: applyEachWith(users, xmlrpc),
    app: applyEachWith(app, xmlrpc)
  }
}

/**
 * Get a REST client to interact with an exist-db instance
 * @param {NodeExistConnectionOptions} options the connection options
 * @returns {NodeExistRestClient} the REST client
 */
export function getRestClient (options) {
  const connection = connect.rest(options)
  const { get, put, post, del } = applyEachWith(rest, connection.client)
  return {
    connection,
    get,
    put,
    post,
    del
  }
}

export const readOptionsFromEnv = connect.readOptionsFromEnv
export function defineMimeTypes (mimeTypes) {
  mime.define(mimeTypes)
}

export function getMimeType (path) {
  return mime.getType(path)
}
