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
  const methods = {}
  for (const method in module) {
    methods[method] = applyWith(module[method], client)
  }
  return methods
}

function connect (options) {
  const client = connection.connect(options)

  return {
    client: client,
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

module.exports = {
  readOptionsFromEnv: connection.readOptionsFromEnv,
  connect,
  defineMimeTypes: function (mimeTypes) {
    mime.define(mimeTypes)
  },
  getMimeType: function (path) {
    return mime.getType(path)
  }
}
