var xmlrpc = require('xmlrpc')
var assign = require('lodash.assign')
var promisedMethodCall = require('./promisedMethodCall')

var defaultRPCoptions = {
  collections: '',
  host: 'localhost',
  port: '8080',
  path: '/exist/xmlrpc',
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  }
}

function connect (options) {
  var client = xmlrpc.createClient(assign({}, defaultRPCoptions, options))
  client.promisedMethodCall = promisedMethodCall(client)
  return client
}

module.exports = connect
