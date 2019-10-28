const resultParser = require('./result-parser')

const defaults = {
  limit: 1, start: 1, cache: 'no'
}

/**
 * returns a promise for a result (sub)set
 * @param client
 * @param query
 * @param options - options.limit and options.start control which
 * @returns {Promise}
 */
function attributeQuery (client, query, options) {
  if (!query) {
    throw new Error('Cannot query DB: Missing query')
  }
  const queryOptions = Object.assign({}, defaults, options)
  queryOptions._query = query
  console.log('query', query)
  return client.get('/').query(queryOptions).then(resultParser.exist)
}

/**
 *
 * @param client
 * @param queryStringOrBuffer
 * @param options
 * @returns {Promise}
 */
function complexQuery (client, queryStringOrBuffer, options) {
  const queryOptions = options || {}
  const limit = queryOptions.limit || 1
  const start = queryOptions.start || 1 // yes, it seems to be 1-based
  const cache = queryOptions.cache ? 'yes' : 'no'

  // these cause null exceptions in exist XML RPC
  delete queryOptions.start
  delete queryOptions.limit
  delete queryOptions.cache

  // const props = (queryOptions) => {
  //   let propXML = ''
  //   for (const option in queryOptions) {
  //     propXML += `<property name="${option}" value="${queryOptions[option]}"/>`
  //   }
  //   return propXML
  // }

  const q = `<query xmlns="http://exist.sourceforge.net/NS/exist" start="${start}" max="${limit}" cache="${cache}">
    <text>
      <![CDATA[${queryStringOrBuffer.toString()}]]>
    </text>
    <properties />
  </query>`

  // console.log(q)
  return client.post('/db/').type('xml').send(q)
}

function getHits (client, resultHandle) {
  return client.promisedMethodCall('getHits', [resultHandle])
}

function retrieveResult (client, handle, position) {
  return client.promisedMethodCall('retrieve', [handle, position, {}])
}

function getAllResults (client, handle, position) {
  var results = []
  while (position--) {
    results.push(retrieveResult(client, handle, position))
  }
  return Promise.all(results.reverse()) // array of results is in reverse order
}

function releaseResult (client, handle) {
  return client.query('_release', handle).send()
}

function readAll (client, queryStringOrBuffer, options) {
  let resultHandle = -1
  let resultPages = -1

  return complexQuery(client, queryStringOrBuffer, options)
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
  read: attributeQuery,
  readAll: readAll,
  complex: complexQuery,
  count: getHits,
  retrieve: retrieveResult,
  retrieveAll: getAllResults,
  releaseResult: releaseResult
}
