/**
 * @typedef { import("xmlrpc").Client } XMLRPCClient
 */

/**
 * returns a promise for a result (sub)set
 * @param {XMLRPCClient} client
 * @param {String} query
 * @param {{limit:number, start:number}} [options] - options.limit and options.start control which
 * @returns {Promise}
 */
function read (client, query, options = {}) {
  const limit = options.limit || 1
  const start = options.start || 1 // yes, start it seems to be 1-based

  // remmove them from options as they cause NPEs in exist-db XML-RPC
  delete options.limit
  delete options.start

  return client.promisedMethodCall('query', [query, limit, start, options])
}

/**
 * Execute a query on the database
 * @param {XMLRPCClient} client
 * @param {String|Buffer} queryStringOrBuffer
 * @param {Object} options
 * @returns {Promise}
 */
function execute (client, queryStringOrBuffer, options = {}) {
  return client.promisedMethodCall('executeQuery', [queryStringOrBuffer, options])
}

function count (client, resultHandle) {
  return client.promisedMethodCall('getHits', [resultHandle])
}

function retrieve (client, handle, position) {
  return client.promisedMethodCall('retrieve', [handle, position, {}])
}

function retrieveAll (client, handle, position) {
  const results = []
  while (position--) {
    results.push(retrieve(client, handle, position))
  }
  return Promise.all(results.reverse()) // array of results is in reverse order
}

function releaseResult (client, handle) {
  return client.promisedMethodCall('releaseQueryResult', [handle])
}

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
