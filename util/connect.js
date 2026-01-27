import { createXmlRpcClient } from '../xmlrpc/xmlrpc-client.js'
import { createExistClient } from './exist-client.js'

/**
 * @typedef { import('./exist-client.js').ConnectionOptions } ConnectionOptions
 */

/**
 * @typedef { import("./exist-client.js").Connection } Connection
 */

/**
 * @typedef { import('../xmlrpc/xmlrpc-client.js').XmlRpcClient } XmlRpcClient
 */

/**
 * @typedef {Object} NodeExistConnectionOptions
 * @prop {{user:string, pass:string}} [basic_auth] database user credentials, default: {"user":"guest","pass":"guest"}
 * @prop {"http:"|"https:"} [protocol] "http:" or "https:", default: "https:"
 * @prop {string} [host] database host, default: "localhost"
 * @prop {string} [port] database port, default: "8443"
 * @prop {string} [path] path to XMLRPC, default: "/exist/xmlrpc"
 * @prop {boolean} [rejectUnauthorized] enforce valid SSL certs, default: true for remote hosts
 */

/**
 * Default REST endpoint
 * @type {string}
 */
export const defaultRestEndpoint = '/exist/rest'

/**
 * Default XML-RPC endpoint
 * @type {string}
 */
export const defaultXmlrpcEndpoint = '/exist/xmlrpc'

/**
 * Default connection options
 * @type {NodeExistConnectionOptions}
 */
export const defaultConnectionOptions = {
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  protocol: 'https:',
  host: 'localhost',
  port: '8443'
}

/**
 * create a REST client to interact with an exist-db instance
 * @param {NodeExistConnectionOptions} [options] connection options
 * @returns {Connection} Extended HTTP client instance
 */
export function rest (options) {
  const mergedOptions = mergeOptions(defaultRestEndpoint, options)
  return createExistClient(mergedOptions)
}

/**
 * Basic authorization header value
 * @prop {{user:string, pass:string}} auth database user credentials
 * @returns {string} header value
 */
function basicAuth (auth) {
  return 'Basic ' + Buffer.from(`${auth.user}:${auth.pass}`).toString('base64')
}

/**
 * Connect to database via XML-RPC
 * @param {NodeExistConnectionOptions} [options] connection options
 * @returns {XmlRpcClient} The XMLRPC-client connected to the database with the given options
 */
export function xmlrpc (options) {
  const mergedOptions = mergeOptions(defaultXmlrpcEndpoint, options)
  return createXmlRpcClient(mergedOptions)
}

/**
 * Merge options with defaults
 *
 * Allow invalid and self-signed certificates on localhost,
 * if not explicitly set to be enforced.
 * @param {string} path default endpoint
 * @param {NodeExistConnectionOptions} [options] given options
 * @returns {ConnectionOptions} connection options, normalized with defaults
 */
function mergeOptions (path, options) {
  const mergedOptions = Object.assign({ path }, defaultConnectionOptions, options)

  // compatibility for older setups
  if ('secure' in mergedOptions) {
    mergedOptions.protocol = mergedOptions.secure ? 'https:' : 'http:'
    delete mergedOptions.secure // remove legacy option
  }

  const isLocalDb = checkIfLocalHost(mergedOptions.host)
  const encrypted = useEncryptedChannel(mergedOptions.protocol)
  const rejectUnauthorized = 'rejectUnauthorized' in mergedOptions
    ? mergedOptions.rejectUnauthorized
    : !(isLocalDb && encrypted)

  if (!isLocalDb) {
    if (!encrypted) {
      console.warn('Connecting to remote DB using an unencrypted channel.')
    }
    if (('rejectUnauthorized' in mergedOptions) && !mergedOptions.rejectUnauthorized) {
      console.warn('Connecting to remote DB allowing invalid certificate.')
    }
  }
  const server = `${mergedOptions.protocol}//${mergedOptions.host}${(mergedOptions.port ? ':' + mergedOptions.port : '')}${mergedOptions.path}`
  const headers = {
    'user-agent': 'node-exist',
    authorization: basicAuth(mergedOptions.basic_auth)
  }

  const user = mergedOptions.basic_auth.user

  return {
    server,
    headers,
    rejectUnauthorized,
    secure: encrypted,
    user
  }
}

/**
 * Is the host considered a local host
 * @param {string} host hostname
 * @returns {boolean} true, if host is local
 */
function checkIfLocalHost (host) {
  return (
    host === 'localhost' ||
    host.startsWith('127.') || // any ipv4 loopback address
    host === '[::1]' || // ipv6 loopback
    host.startsWith('[::ffff:127.') // any ipv6 mapped ipv4 loopback address
  )
}

/**
 * SSL or not?
 * @param {string} protocol must end in colon
 * @returns {boolean} true, if encrypted connection
 */
function useEncryptedChannel (protocol) {
  return protocol === 'https:'
}

/**
 * Read connection options from ENV
 * NOTE: The connection options returned from this function
 * have a separate set of defaults.
 * @returns {NodeExistConnectionOptions}
 */
export function readOptionsFromEnv () {
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

    environmentOptions.protocol = protocol
    environmentOptions.host = hostname
    environmentOptions.port = port
  }

  return environmentOptions
}
