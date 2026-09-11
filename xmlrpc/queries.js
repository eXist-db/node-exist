/**
 * @typedef { import("./xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */

/**
 * @typedef {Object} CallOptions
 * @prop {number} [timeout] milliseconds before the call times out, 0 waits indefinitely, defaults to the connection timeout
 */

/**
 * Query the database and receive a (sub)set of results
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String} query the database query string
 * @param {{limit:number, start:number, timeout:number}} [options] "start" at the n-th result item and "limit" set to n items, "timeout" overrides the connection timeout
 * @returns {Promise} result set
 */
function read (client, query, options = {}) {
  const limit = options.limit || 1
  const start = options.start || 1 // yes, start it seems to be 1-based

  // remmove them from options as they cause NPEs in exist-db XML-RPC
  delete options.limit
  delete options.start

  const { timeout, ...queryOptions } = options
  return client.methodCall('query', [query, limit, start, queryOptions], { timeout })
}

/**
 * Execute a query on the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String|Buffer} queryStringOrBuffer the database query can be a string or a buffer (for main modules read from a file)
 * @param {Object} options additional options, "timeout" overrides the connection timeout and is not sent to the database
 * @returns {Promise<Number>} result handle
 */
function execute (client, queryStringOrBuffer, options = {}) {
  const { timeout, ...queryOptions } = options ?? {}
  return client.methodCall('executeQuery', [queryStringOrBuffer, queryOptions], { timeout })
}

/**
 * count the number of results for a result set identified by result handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @param {CallOptions} [callOptions] override the connection timeout
 * @returns {Promise<Number>} number of results
 */
function count (client, handle, callOptions) {
  return client.methodCall('getHits', [handle], callOptions)
}

/**
 * retrieve a result item at position for set identified by result handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @param {Number} position the result item to retrieve
 * @param {CallOptions} [callOptions] override the connection timeout
 * @returns {Promise<any>} the next result item
 */
function retrieve (client, handle, position, callOptions) {
  return client.methodCall('retrieve', [handle, position, {}], callOptions)
}

/**
 * Convenience function to retrieve all result pages for a result set identified by handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @param {Number} position number of result item to retrieve
 * @param {CallOptions} [callOptions] override the connection timeout
 * @returns {Promise<Array>} array of all result items
 */
function retrieveAll (client, handle, position, callOptions) {
  const results = []
  while (position--) {
    results.push(retrieve(client, handle, position, callOptions))
  }
  return Promise.all(results.reverse()) // array of results is in reverse order
}

/**
 * When a result set is no longer needed, release it
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle to release
 * @param {CallOptions} [callOptions] override the connection timeout
 * @returns {Promise<boolean>} true when the result was released
 */
function releaseResult (client, handle, callOptions) {
  return client.methodCall('releaseQueryResult', [handle], callOptions)
}

/**
 * Convenience function to execute a query and retrieve all results
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String|Buffer} queryStringOrBuffer the database query can be a string or a buffer (for main modules read from a file)
 * @param {Object} options additional options, "timeout" overrides the connection timeout for every call
 * @returns {Promise<{query: String|Buffer, options: Object, hits: Number, pages: Array}>} all results
 */
function readAll (client, queryStringOrBuffer, options = {}) {
  const callOptions = { timeout: options?.timeout }
  let resultHandle = -1
  let resultPages = -1
  let results, error

  return execute(client, queryStringOrBuffer, options)
    .then(function (handle) {
      resultHandle = handle
      return count(client, handle, callOptions)
    })
    .then(function (hits) {
      resultPages = hits
      return retrieveAll(client, resultHandle, hits, callOptions)
    })
    .then(function (pages) {
      results = {
        query: queryStringOrBuffer,
        options,
        hits: resultPages,
        pages
      }

      return releaseResult(client, resultHandle, callOptions)
    })
    .then(function () {
      return results
    })
    .catch(function (e) {
      error = e
      // try to clean up even after an error if there is something to free
      if (resultHandle >= 0) {
        return releaseResult(client, resultHandle, callOptions)
      }
      return Promise.reject(e)
    })
    .catch(function () {
      return Promise.reject(error)
    })
}

export {
  read,
  readAll,
  execute,
  count,
  retrieve,
  retrieveAll,
  releaseResult
}
