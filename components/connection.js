const xmlrpc = require('xmlrpc')
const assign = require('lodash.assign')
const promisedMethodCall = require('./promisedMethodCall')

/**
 * @typedef { import("xmlrpc").Client } XMLRPCClient
 */

/**
 * @typedef {Object} NodeExistConnectionOptions
 * @prop {string} [host] database host, default: "localhost"
 * @prop {string} [port] database port, default: "8443"
 * @prop {boolean} [secure] use HTTPS? default: true
 * @prop {boolean} [rejectUnauthorized] enforce valid SSL connection, default: true
 * @prop {string} [path] path to XMLRPC, default: "/exist/xmlrpc"
 * @prop {{user:string, pass:string}} [basic_auth] database user credentials, default: {"user":"guest","pass":"guest"}
 */

/**
 * Default connection options
 * @type {NodeExistConnectionOptions}
 */
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
 * @param {NodeExistConnectionOptions} options
 * @returns {XMLRPCClient} XMLRPC-client
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

/**
 * Read connection options from ENV
 * NOTE: The connection options returned from this function
 * have a separate set of defaults.
 * @returns {NodeExistConnectionOptions}
 */
function readOptionsFromEnv () {
  const environmentOptions = {}

  if (process.env.EXISTDB_USER && 'EXISTDB_PASS' in process.env) {
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
