/**
 * @typedef { import("./xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */

/**
 * Query the database and receive a (sub)set of results
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String} query the database query string
 * @param {{limit:number, start:number}} [options] "start" at the n-th result item and "limit" set to n items
 * @returns {Promise} result set
 */
function read (client, query, options = {}) {
  const limit = options.limit || 1
  const start = options.start || 1 // yes, start it seems to be 1-based

  // remmove them from options as they cause NPEs in exist-db XML-RPC
  delete options.limit
  delete options.start

  return client.methodCall('query', [query, limit, start, options])
}

/**
 * Execute a query on the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String|Buffer} queryStringOrBuffer the database query can be a string or a buffer (for main modules read from a file)
 * @param {Object} options additional options
 * @returns {Promise<Number>} result handle
 */
function execute (client, queryStringOrBuffer, options = {}) {
  return client.methodCall('executeQuery', [queryStringOrBuffer, options])
}

/**
 * count the number of results for a result set identified by result handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @returns {Promise<Number>} number of results
 */
function count (client, handle) {
  return client.methodCall('getHits', [handle])
}

/**
 * retrieve a result item at position for set identified by result handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @param {Number} position the result item to retrieve
 * @returns {Promise<any>} the next result item
 */
function retrieve (client, handle, position) {
  return client.methodCall('retrieve', [handle, position, {}])
}

/**
 * Convenience function to retrieve all result pages for a result set identified by handle
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle
 * @param {Number} position number of result item to retrieve
 * @returns {Promise<Array>} array of all result items
 */
function retrieveAll (client, handle, position) {
  const results = []
  while (position--) {
    results.push(retrieve(client, handle, position))
  }
  return Promise.all(results.reverse()) // array of results is in reverse order
}

/**
 * When a result set is no longer needed, release it
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {Number} handle the result handle to release
 * @returns {Promise<boolean>} true when the result was released
 */
function releaseResult (client, handle) {
  return client.methodCall('releaseQueryResult', [handle])
}

/**
 * Convenience function to execute a query and retrieve all results
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {String|Buffer} queryStringOrBuffer the database query can be a string or a buffer (for main modules read from a file)
 * @param {Object} options additional options
 * @returns {Promise<{query: String|Buffer, options: Object, hits: Number, pages: Array}>} all results
 */
function readAll (client, queryStringOrBuffer, options = {}) {
  let resultHandle = -1
  let resultPages = -1
  let results, error

  return execute(client, queryStringOrBuffer, options)
    .then(function (handle) {
      resultHandle = handle
      return count(client, handle)
    })
    .then(function (hits) {
      resultPages = hits
      return retrieveAll(client, resultHandle, hits)
    })
    .then(function (pages) {
      results = {
        query: queryStringOrBuffer,
        options,
        hits: resultPages,
        pages
      }

      return releaseResult(client, resultHandle)
    })
    .then(function () {
      return results
    })
    .catch(function (e) {
      error = e
      // try to clean up even after an error if there is something to free
      if (resultHandle >= 0) {
        return releaseResult(client, resultHandle)
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
