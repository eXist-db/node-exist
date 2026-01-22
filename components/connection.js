import { createXmlRpcClient } from './xmlrpc-client.js'

/**
 * @typedef {import('./xmlrpc-client.js').XmlRpcClient} XmlRpcClient
 */

/**
 * @typedef { import("got").Got } Got
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
 * @typedef {Object} MergedOptions
 * @prop {string} prefixUrl full URL prefix for requests
 * @prop {Object} headers base headers for requests
 * @prop {boolean} isSecureClient indicates if connection is using an encrypted channel (https)
 * @prop {boolean} [rejectUnauthorized] enforce valid SSL certs, if https: is used
 */

/**
 * Default REST endpoint
 * @type {string}
 */
const defaultRestEndpoint = '/exist/rest'

/**
 * Default XML-RPC endpoint
 * @type {string}
 */
const defaultXmlrpcEndpoint = '/exist/xmlrpc'

/**
 * Default connection options
 * @type {NodeExistConnectionOptions}
 */
const defaultConnectionOptions = {
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  protocol: 'https:',
  host: 'localhost',
  port: '8443'
}

/**
 * get REST client
 * @param {NodeExistConnectionOptions} [options] connection options
 * @returns {Got<never>} Extended HTTP client instance
 */
async function restConnection (options) {
  const { got } = await import('got')
  /* eslint camelcase: "off" */
  const { prefixUrl, headers, rejectUnauthorized } = mergeOptions(defaultRestEndpoint, options)

  const httpClientOptions = {
    prefixUrl,
    headers: { ...headers },
    https: { rejectUnauthorized }
  }

  return got.extend(httpClientOptions)
}

/**
 * Basic authorization header value
 * @prop {{user:string, pass:string}} auth database user credentials
 * @returns {string} header value
 */
export function basicAuth (auth) {
  return 'Basic ' + Buffer.from(`${auth.user}:${auth.pass}`).toString('base64')
}

/**
 * Connect to database via XML-RPC
 * @param {NodeExistConnectionOptions} [options] connection options
 * @returns {XmlRpcClient} The XMLRPC-client connected to the database with the given options
 */
function connect (options) {
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
 * @returns {MergedOptions} merged options
 */
function mergeOptions (path, options) {
  const mergedOptions = Object.assign({ path }, defaultConnectionOptions, options)

  // compatibility for older setups
  if ('secure' in mergedOptions) {
    mergedOptions.protocol = mergedOptions.secure ? 'https:' : 'http:'
    delete mergedOptions.secure // remove legacy option
  }

  const isLocalDb = checkIfLocalHost(mergedOptions.host)
  const isSecureClient = useSecureConnection(mergedOptions.protocol)
  const rejectUnauthorized = 'rejectUnauthorized' in mergedOptions
    ? mergedOptions.rejectUnauthorized
    : !(isLocalDb && isSecureClient)

  if (!isLocalDb) {
    if (!isSecureClient) {
      console.warn('Connecting to remote DB using an unencrypted channel.')
    }
    if (('rejectUnauthorized' in mergedOptions) && !mergedOptions.rejectUnauthorized) {
      console.warn('Connecting to remote DB allowing invalid certificate.')
    }
  }
  const prefixUrl = `${mergedOptions.protocol}//${mergedOptions.host}${(mergedOptions.port ? ':' + mergedOptions.port : '')}${mergedOptions.path}`
  const headers = {
    'user-agent': 'node-exist',
    authorization: basicAuth(mergedOptions.basic_auth)
  }

  return {
    prefixUrl,
    headers,
    rejectUnauthorized,
    isSecureClient
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
    host === '127.0.0.1' || // TODO: 127.0.1.1 is also local
    host === '[::1]' // TODO: match all ipv6 addresses considered local
  )
}

/**
 * SSL or not?
 * @param {string} protocol must end in colon
 * @returns {boolean} true, if encrypted connection
 */
function useSecureConnection (protocol) {
  return protocol === 'https:'
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

    environmentOptions.protocol = protocol
    environmentOptions.host = hostname
    environmentOptions.port = port
  }

  return environmentOptions
}

export {
  connect,
  readOptionsFromEnv,
  restConnection,
  defaultConnectionOptions,
  defaultXmlrpcEndpoint,
  defaultRestEndpoint
}
