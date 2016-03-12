var mime = require('mime')

// components
var connection = require('./components/connection')
var database = require('./components/database')
var queries = require('./components/queries')
var resources = require('./components/resources')
var documents = require('./components/documents')
var collections = require('./components/collections')
var indices = require('./components/indices')
var users = require('./components/users')

// exist specific mime types
mime.define({
  'application/xquery': ['xq', 'xql', 'xqm'],
  'application/xml': ['xconf']
})

// helper functions

function applyWith (func, client) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    return func.apply(null, [client].concat(args))
  }
}

function applyEachWith (module, client) {
  var methods = {}
  for (var method in module) {
    methods[method] = applyWith(module[method], client)
  }
  return methods
}

module.exports = {
  connect: function (options) {
    var client = connection(options)
    return {
      client: client,
      server: applyEachWith(database, client),
      queries: applyEachWith(queries, client),
      resources: applyEachWith(resources, client),
      documents: applyEachWith(documents, client),
      collections: applyEachWith(collections, client),
      indices: applyEachWith(indices, client),
      users: applyEachWith(users, client)
    }
  },
  defineMimeTypes: function (mimeTypes) {
    mime.define(mimeTypes)
  },
  getMimeTypes: function () {
    return mime.types
  }
}
