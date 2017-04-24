/**
 * returns a promise for a result (sub)set
 * @param client
 * @param query
 * @param options - options.limit and options.start control which
 * @returns {Promise}
 */
function read (client, query, options) {
  var limit = options.limit || 1
  var start = options.start || 1 // yes, it seems to be 1-based
  var queryOptions = options || {}

  // these cause null exceptions in exist XML RPC
  delete queryOptions.start
  delete queryOptions.limit

  return client.promisedMethodCall('query', [ query, limit, start, queryOptions ])
}

/**
 *
 * @param client
 * @param queryStringOrBuffer
 * @param options
 * @returns {Promise}
 */
function execute (client, queryStringOrBuffer, options) {
  return client.promisedMethodCall('executeQuery', [ queryStringOrBuffer, options ])
}

function getHits (client, resultHandle) {
  return client.promisedMethodCall('getHits', [ resultHandle ])
}

function retrieveResult (client, handle, position) {
  return client.promisedMethodCall('retrieve', [ handle, position, {} ])
}

function getAllResults (client, handle, position) {
  var results = []
  while (position--) {
    results.push(retrieveResult(client, handle, position))
  }
  return Promise.all(results.reverse()) // array of results is in reverse order
}

function releaseResult (client, handle) {
  return client.promisedMethodCall('releaseQueryResult', [ handle ])
}

function readAll (client, queryStringOrBuffer, options) {
  var resultHandle = -1
  var resultPages = -1

  return execute(client, queryStringOrBuffer, options)
    .then(function (handle) {
      resultHandle = handle
      return getHits(client, handle)
    })
    .then(function (hits) {
      resultPages = hits
      return getAllResults(client, resultHandle, hits)
    })
    .then(function (results) {
      releaseResult(client, resultHandle)
      return {
        query: queryStringOrBuffer,
        options: options,
        hits: resultPages,
        pages: results
      }
    })
    .catch(function (e) {
      releaseResult(client, resultHandle)
      return Promise.reject(e)
    })
}

module.exports = {
  read: read,
  readAll: readAll,
  execute: execute,
  count: getHits,
  retrieve: retrieveResult,
  retrieveAll: getAllResults,
  releaseResult: releaseResult
}
