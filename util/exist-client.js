import { Client, Pool, interceptors } from 'undici'

/**
 * @typedef { import("undici").Client } Client
 */

/**
 * @typedef {Object} ConnectionOptions
 * @prop {string} user the user account name connecting to the database
 * @prop {string} server full URL prefix for requests
 * @prop {Object} headers base headers for requests
 * @prop {boolean} secure indicates if connection is using an encrypted channel (https)
 * @prop {boolean} [rejectUnauthorized=false] enforce valid SSL certs, if https: is used
 * @prop {boolean} [throwOnError=true] controls if the client throws on error
 * @prop {number} [timeout=0] milliseconds to wait for response headers and between body chunks, 0 waits indefinitely
 * @prop {number} [connections=1] how many connections to open to the server; requests share them, more than one lets
 *   requests run in parallel over HTTP/1.1, where each connection serves one request at a time
 */

/**
 * @typedef {Object} Connection
 * @prop {import("undici").Dispatcher} client underlying undici.Client, or undici.Pool for more than one connection
 * @prop {string} user the user account name connecting to the database
 * @prop {string} server full URL prefix for requests
 * @prop {string} pathname path prefix that is used for requests
 * @prop {boolean} secure indicates if connection is using an encrypted channel (https)
 * @prop {number} timeout milliseconds before a request times out, 0 waits indefinitely
 * @prop {number} connections how many connections are opened to the server
 */

const existRequestInterceptor = (basepath, baseheaders) => dispatch => {
  return (opts, handler) => {
    const { path, headers } = opts
    opts.path = `${basepath}/${path}`
    opts.headers = { ...headers, ...baseheaders }
    return dispatch(opts, handler)
  }
}

/**
 * undici request options overriding the connection timeout for a single request
 * @param {number} [timeout] milliseconds, 0 waits indefinitely, undefined keeps the connection timeout
 * @returns {{headersTimeout?: number, bodyTimeout?: number}} options to spread into a request
 */
export function requestTimeouts (timeout) {
  if (timeout == null) {
    return {}
  }
  return { headersTimeout: timeout, bodyTimeout: timeout }
}

/**
 * create a REST client to interact with an exist-db instance
 * @param {ClientOptions} options the connection options
 * @returns {Connection} undici.Client instance
 */
export function createExistClient ({ server, headers, rejectUnauthorized, user, secure, throwOnError = true, timeout, connections = 1 }) {
  const parsed = new URL(server)
  // path prefix has to be passed in to interceptor
  // client cannot work with anything other than clean origin
  const { pathname } = parsed
  parsed.pathname = '/'
  // undici gives up after 300 seconds by default, queries and package
  // installations can take much longer
  const connectionTimeout = timeout ?? 0
  if (!Number.isInteger(connections) || connections < 1) {
    throw new Error('connections must be a positive integer, got: ' + connections)
  }
  const clientOptions = {
    headersTimeout: connectionTimeout,
    bodyTimeout: connectionTimeout,
    connect: {
      keepAlive: true,
      rejectUnauthorized
    }
  }
  // one Client serves one request at a time over HTTP/1.1 (XML-RPC POSTs are never pipelined),
  // a Pool spreads them over several connections
  const dispatcher = connections === 1
    ? new Client(parsed, clientOptions)
    : new Pool(parsed, { ...clientOptions, connections })
  const _client = dispatcher
    .compose(existRequestInterceptor(pathname, headers))

  const client = throwOnError
    ? _client.compose(interceptors.responseError({ throwOnError }))
    : _client

  return {
    secure,
    server,
    user,
    pathname,
    timeout: connectionTimeout,
    connections,
    client
  }
}
