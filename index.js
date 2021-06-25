//* /@type/..[name]
/**
 * @typedef {import('xmlrpc').Client} XMLRPCClient
 * @typedef {import('./index')}
 * @typedef {import('./index').Modules} Modules
 * @typedef {import('./index').Module} Module
 * @typedef {import('./index').BoundModule} BoundModule
 * @typedef {import('./index').ConnectionOptions} ConnectionOptions
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

/**
 *
 * @param {XMLRPCClient} client
 * @param {Module} module a component that exports a variety of functions
 * @returns {BoundModule} bound module functions
 */
function bindEachInModuleTo (client, module) {
  const methods = {}
  for (const method in module) {
    const f = module[method]
    methods[method] = f.bind(null, client)
  }
  return methods
}

/**
 * connect to an existdb instance
 *
 * @param {ConnectionOptions} options
 * @returns {Modules}
 */
function connect (options) {
  const client = connection(options)

  return {
    client: client,
    server: bindEachInModuleTo(client, database),
    queries: bindEachInModuleTo(client, queries),
    resources: bindEachInModuleTo(client, resources),
    documents: bindEachInModuleTo(client, documents),
    collections: bindEachInModuleTo(client, collections),
    indices: bindEachInModuleTo(client, indices),
    users: bindEachInModuleTo(client, users),
    app: bindEachInModuleTo(client, app)
  }
}

function defineMimeTypes (mimeTypes) {
  mime.define(mimeTypes)
}

function getMimeType (path) {
  return mime.getType(path)
}

module.exports = {
  connect,
  defineMimeTypes,
  getMimeType
}
