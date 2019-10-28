const mime = require('mime')

// components
const connection = require('./components/connection')
const database = require('./components/database')
const queries = require('./components/queries')
// const resources = require('./components/resources')
const documents = require('./components/documents')
// const collections = require('./components/collections')
// const indices = require('./components/indices')
// const users = require('./components/users')
const app = require('./components/app')
const permissions = require('./components/permissions')

// exist specific mime types
mime.define({
  'application/xquery': ['xq', 'xql', 'xqm'],
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

module.exports = {
  connect: function (options) {
    const client = connection(options)

    return {
      client: client,
      server: applyEachWith(database, client),
      queries: applyEachWith(queries, client),
      // resources: applyEachWith(resources, client),
      documents: applyEachWith(documents, client),
      // collections: applyEachWith(collections, client),
      // indices: applyEachWith(indices, client),
      // users: applyEachWith(users, client),
      app: applyEachWith(app, client),
      permissions: applyEachWith(permissions, client),
      head: (documentName) => client.head(documentName),
      put: applyWith(documents.upload, client),
      get: applyWith(documents.read, client),
      delete: (documentName) => client.delete(documentName),
      query: (query, options) => queries.read(client, query, options)
    }
  },
  defineMimeTypes: function (mimeTypes) {
    mime.define(mimeTypes)
  },
  getMimeType: function (path) {
    return mime.getType(path)
  }
}
