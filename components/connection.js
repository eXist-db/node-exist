var xmlrpc = require('xmlrpc')
var assign = require('lodash.assign')
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
  return xmlrpc.createClient(assign({}, defaultRPCoptions, options))
}

module.exports = connect
