const xmlrpc = require('xmlrpc')
const assign = require('lodash.assign')
const promisedMethodCall = require('./promisedMethodCall')

const defaultRPCoptions = {
  collections: '',
  host: 'localhost',
  port: '8443',
  path: '/exist/xmlrpc',
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  }
}

function isLocalDB (host) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]'
  )
}

function useSecureConnection (options) {
  if (options && 'secure' in options) {
    return Boolean(options.secure)
  }
  return true
}

/**
 * Connect to database via XML-RPC
 * @param {Object} options
 * @returns {Object} XMLRPC-client
 */
function connect (options) {
  const _options = assign({}, defaultRPCoptions, options)
  delete _options.secure // prevent pollution of xmlprc options
  if (useSecureConnection(options)) {
    const secureClient = xmlrpc.createSecureClient(_options)
    secureClient.promisedMethodCall = promisedMethodCall(secureClient)
    return secureClient
  }
  if (!isLocalDB(_options.host)) {
    console.warn('Connecting to DB using an unencrypted channel.')
  }
  const client = xmlrpc.createClient(_options)
  client.promisedMethodCall = promisedMethodCall(client)
  return client
}

module.exports = connect
