import { Client, interceptors } from 'undici'

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
 */

/**
 * @typedef {Object} Connection
 * @prop {Client} client underlying undici.Client instance
 * @prop {string} user the user account name connecting to the database
 * @prop {string} server full URL prefix for requests
 * @prop {string} pathname path prefix that is used for requests
 * @prop {boolean} secure indicates if connection is using an encrypted channel (https)
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
 * create a REST client to interact with an exist-db instance
 * @param {ClientOptions} options the connection options
 * @returns {Connection} undici.Client instance
 */
export function createExistClient ({ server, headers, rejectUnauthorized, user, secure, throwOnError = true }) {
  const parsed = new URL(server)
  // path prefix has to be passed in to interceptor
  // client cannot work with anything other than clean origin
  const { pathname } = parsed
  parsed.pathname = '/'
  const _client = new Client(parsed, {
    connect: {
      keepAlive: true,
      rejectUnauthorized
    }
  })
    .compose(existRequestInterceptor(pathname, headers))

  const client = throwOnError
    ? _client.compose(interceptors.responseError({ throwOnError }))
    : _client

  return {
    secure,
    server,
    user,
    pathname,
    client
  }
}
