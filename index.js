import { mime } from './util/mime.js'
import { xmlrpc, rest, readOptionsFromEnv } from './util/connect.js'

// xmlrpc
import * as database from './xmlrpc/database.js'
import * as queries from './xmlrpc/queries.js'
import * as resources from './xmlrpc/resources.js'
import * as documents from './xmlrpc/documents.js'
import * as collections from './xmlrpc/collections.js'
import * as indices from './xmlrpc/indices.js'
import * as users from './xmlrpc/users.js'
import * as app from './xmlrpc/app.js'

// rest
import * as verbs from './rest/verbs.js'

/**
 * @typedef { import("./util/connect.js").NodeExistConnectionOptions } NodeExistConnectionOptions
 */
/**
 * @typedef { import("./xmlrpc/xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */
/**
 * @typedef { import("./util/exist-client.js").Connection } Connection
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
 * @prop {(rawPath:string, searchParams:Object, writableStream:Writable) => Promise<any>} get retrieve resources via HTTP GET
 * @prop {(body:string|Buffer|Readable|Generator|AscynGenerator|FormData, rawPath:string, mimetype?:string) => Promise<any>} put store resources via HTTP PUT
 * @prop {(query:string|Buffer, rawPath:string, options?:Object) => Promise<any>} post send resources via HTTP POST
 * @prop {(rawPath:string) => Promise<any>} del remove resources via HTTP DELETE
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
  const xmlrpcConnection = xmlrpc(options)
  const { connection, methodCall } = xmlrpcConnection
  return {
    connection,
    methodCall,
    server: applyEachWith(database, xmlrpcConnection),
    queries: applyEachWith(queries, xmlrpcConnection),
    resources: applyEachWith(resources, xmlrpcConnection),
    documents: applyEachWith(documents, xmlrpcConnection),
    collections: applyEachWith(collections, xmlrpcConnection),
    indices: applyEachWith(indices, xmlrpcConnection),
    users: applyEachWith(users, xmlrpcConnection),
    app: applyEachWith(app, xmlrpcConnection)
  }
}

/**
 * Get a REST client to interact with an exist-db instance
 * @param {NodeExistConnectionOptions} options the connection options
 * @returns {NodeExistRestClient} the REST client
 */
export function getRestClient (options) {
  const connection = rest(options)
  const { get, put, post, del } = applyEachWith(verbs, connection.client)
  return {
    connection,
    get,
    put,
    post,
    del
  }
}

export {
  readOptionsFromEnv
}

export function defineMimeTypes (mimeTypes) {
  mime.define(mimeTypes)
}

export function getMimeType (path) {
  return mime.getType(path)
}
