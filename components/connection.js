const xmlrpc = require('xmlrpc')
const assign = require('lodash.assign')
const promisedMethodCall = require('./promisedMethodCall')

const defaultRPCoptions = {
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
  delete _options.secure // prevent pollution of XML-RPC options

  if (useSecureConnection(options)) {
    // allow invalid and self-signed certificates on localhost, if not explicitly
    // enforced by setting options.rejectUnauthorized to true
    _options.rejectUnauthorized = ('rejectUnauthorized' in _options)
      ? _options.rejectUnauthorized
      : !isLocalDB(_options.host)

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

function readOptionsFromEnv () {
  const environmentOptions = {}

  if (process.env.EXISTDB_USER && process.env.EXISTDB_PASS) {
    environmentOptions.basic_auth = {
      user: process.env.EXISTDB_USER,
      pass: process.env.EXISTDB_PASS
    }
  }

  if (process.env.EXISTDB_SERVER) {
    const server = process.env.EXISTDB_SERVER
    const { port, hostname, protocol } = new URL(server)

    if (!['https:', 'http:'].includes(protocol)) {
      throw new Error('Unknown protocol: "' + protocol + '"!')
    }

    environmentOptions.secure = protocol === 'https:'
    environmentOptions.host = hostname
    environmentOptions.port = port
  }

  return environmentOptions
}

module.exports = {
  connect,
  readOptionsFromEnv,
  defaultRPCoptions
}
